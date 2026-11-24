from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from projects.models import ProjectMemory
from projects.selectors import ProjectSelector
from projects.serializers import ProjectMemorySerializer


class ProjectMemoryListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get_project(self, request, project_id):
        return get_object_or_404(
            ProjectSelector.get_user_projects(request.user),
            pk=project_id,
        )

    def get(self, request, project_id):
        project = self.get_project(request, project_id)
        memories = ProjectMemory.objects.filter(
            user=request.user,
            project=project,
        )
        requested_status = request.query_params.get("status")
        if requested_status:
            valid_statuses = {value for value, _ in ProjectMemory.STATUSES}
            if requested_status not in valid_statuses:
                return Response(
                    {"status": "État de mémoire invalide."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            memories = memories.filter(status=requested_status)
        return Response(
            ProjectMemorySerializer(memories, many=True).data,
            status=status.HTTP_200_OK,
        )

    def post(self, request, project_id):
        project = self.get_project(request, project_id)
        serializer = ProjectMemorySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        memory = serializer.save(
            user=request.user,
            project=project,
        )
        return Response(
            ProjectMemorySerializer(memory).data,
            status=status.HTTP_201_CREATED,
        )


class ProjectMemoryDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, request, project_id, memory_id):
        project = get_object_or_404(
            ProjectSelector.get_user_projects(request.user),
            pk=project_id,
        )
        return get_object_or_404(
            ProjectMemory.objects.filter(
                user=request.user,
                project=project,
            ),
            pk=memory_id,
        )

    def patch(self, request, project_id, memory_id):
        memory = self.get_object(request, project_id, memory_id)
        serializer = ProjectMemorySerializer(
            memory,
            data=request.data,
            partial=True,
        )
        serializer.is_valid(raise_exception=True)
        updated = serializer.save(version=memory.version + 1)
        return Response(
            ProjectMemorySerializer(updated).data,
            status=status.HTTP_200_OK,
        )

    def delete(self, request, project_id, memory_id):
        memory = self.get_object(request, project_id, memory_id)
        memory.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
