from pathlib import Path

from django.db.models import Count
from django.http import FileResponse
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from projects.models import ProjectDocument
from projects.selectors import ProjectSelector
from projects.serializers import ProjectDocumentSerializer
from projects.services.document_library import index_project_document, search_project_documents


class ProjectDocumentListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get_project(self, request, project_id):
        return get_object_or_404(
            ProjectSelector.get_user_projects(request.user), pk=project_id
        )

    def get(self, request, project_id):
        project = self.get_project(request, project_id)
        query = str(request.query_params.get("q", "")).strip()
        if query:
            if len(query) > 500:
                return Response(
                    {"detail": "La recherche est limitée à 500 caractères."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            chunks = search_project_documents(
                user=request.user, project=project, query=query
            )
            return Response({
                "query": query,
                "results": [
                    {
                        "document_id": chunk.document_id,
                        "document_name": chunk.document.original_name,
                        "chunk_id": chunk.pk,
                        "ordinal": chunk.ordinal,
                        "start_offset": chunk.start_offset,
                        "end_offset": chunk.end_offset,
                        "page_number": chunk.page_number,
                        "section_title": chunk.section_title,
                        "text": chunk.text,
                    }
                    for chunk in chunks
                ],
            })
        documents = ProjectDocument.objects.filter(
            user=request.user, project=project
        ).annotate(chunk_count=Count("chunks"))
        return Response(
            ProjectDocumentSerializer(
                documents, many=True, context={"request": request}
            ).data
        )

    def post(self, request, project_id):
        project = self.get_project(request, project_id)
        uploaded_file = request.FILES.get("file")
        if not uploaded_file:
            return Response(
                {"file": "Ajoutez un fichier dans le champ 'file'."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            document, created = index_project_document(
                user=request.user, project=project, uploaded_file=uploaded_file
            )
        except (ValueError, PermissionError) as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(
            ProjectDocumentSerializer(
                document, context={"request": request}
            ).data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )


class ProjectDocumentDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, project_id, document_id):
        project = get_object_or_404(
            ProjectSelector.get_user_projects(request.user), pk=project_id
        )
        document = get_object_or_404(
            ProjectDocument.objects.filter(user=request.user, project=project),
            pk=document_id,
        )
        file_field = document.file
        document.delete()
        if file_field:
            file_field.delete(save=False)
        return Response(status=status.HTTP_204_NO_CONTENT)

    def get(self, request, project_id, document_id):
        project = get_object_or_404(
            ProjectSelector.get_user_projects(request.user), pk=project_id
        )
        document = get_object_or_404(
            ProjectDocument.objects.filter(user=request.user, project=project),
            pk=document_id,
        )
        return FileResponse(
            document.file.open("rb"),
            as_attachment=True,
            filename=Path(document.original_name).name,
            content_type="application/octet-stream",
        )
