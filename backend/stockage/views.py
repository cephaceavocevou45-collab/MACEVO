from django.shortcuts import render

def stockage(request):
    return render(request, "stockage/stockage.html")
