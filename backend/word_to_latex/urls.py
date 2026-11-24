from django.urls import path

from .views import (
    UploadWordDocumentAPIView,
    ConversionListAPIView,
    ConversionDetailAPIView,
    DeleteConversionAPIView,
    ConversionFileDownloadAPIView,
    ConversionZipExportAPIView,
    ConversionPdfExportAPIView,
    UploadPdfToLatexAPIView,
    DownloadPdfLatexArchiveAPIView,
    CreatePdfLatexShareAPIView,
    SharedPdfLatexDownloadAPIView,
)


app_name = "word_to_latex"


urlpatterns = [
    path(
        "pdf-to-latex/convert/",
        UploadPdfToLatexAPIView.as_view(),
        name="upload_pdf_to_latex",
    ),
    path(
        "pdf-to-latex/archive/",
        DownloadPdfLatexArchiveAPIView.as_view(),
        name="download_pdf_latex_archive",
    ),
    path(
        "pdf-to-latex/share/",
        CreatePdfLatexShareAPIView.as_view(),
        name="create_pdf_latex_share",
    ),
    path(
        "shared/<uuid:token>/",
        SharedPdfLatexDownloadAPIView.as_view(),
        name="shared_pdf_latex_download",
    ),
    path(
        "upload/",
        UploadWordDocumentAPIView.as_view(),
        name="upload_word_document",
    ),
    path(
        "conversions/",
        ConversionListAPIView.as_view(),
        name="conversion_list",
    ),
    path(
        "conversions/<uuid:id>/",
        ConversionDetailAPIView.as_view(),
        name="conversion_detail",
    ),
    path(
        "conversions/<uuid:id>/delete/",
        DeleteConversionAPIView.as_view(),
        name="conversion_delete",
    ),
    path(
        "conversions/<uuid:id>/download/<str:file_type>/",
        ConversionFileDownloadAPIView.as_view(),
        name="conversion_file_download",
    ),
    path(
        "conversions/<uuid:id>/export/zip/",
        ConversionZipExportAPIView.as_view(),
        name="conversion_zip_export",
    ),
    path(
        "conversions/<uuid:id>/export/pdf/",
        ConversionPdfExportAPIView.as_view(),
        name="conversion_pdf_export",
    ),
]
