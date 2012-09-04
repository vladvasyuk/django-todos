from todos.models import Task,Tag
from django.contrib import admin

class TaskAdmin(admin.ModelAdmin):
    list_display = ('title','user','deadline','completed')
    list_editable = ('completed',)
    list_filter = ('completed','deadline','user')

class TagAdmin(admin.ModelAdmin):
    list_display = ('value','user')
    list_filter = ('user',)

admin.site.register(Task,TaskAdmin)
admin.site.register(Tag,TagAdmin)