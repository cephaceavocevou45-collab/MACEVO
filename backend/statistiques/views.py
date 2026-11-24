from django.shortcuts import render

def statistiques(request):
    return render(request, "statistiques/statistiques.html")
