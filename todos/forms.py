from django import forms
from todos.models import Task, Tag
from django.core.validators import RegexValidator, MaxValueValidator, MinValueValidator

class TaskForm(forms.Form):
    title = forms.CharField(max_length=255,required=True)
    priority = forms.IntegerField(required=False, validators=[
            MaxValueValidator(100),
            MinValueValidator(1),
        ])
    date_completed = forms.DateTimeField(required=False)
    deadline = forms.DateField(required=False)
    completed = forms.BooleanField(required=False)

class TagForm(forms.Form):
    value = forms.CharField(max_length=20,required=True, validators=[
            RegexValidator(regex='^\w+$', message='Incorrect tag name', code='invalid_regex')
        ])