from django.urls import path

from .views import LatexCompileView, LatexPdfView


app_name = "latex"


urlpatterns = [

    path(
        "compile",
        LatexCompileView.as_view(),
        name="compile",
    ),

    path(
        "pdf/<str:compilation_id>",
        LatexPdfView.as_view(),
        name="pdf",
    ),

]