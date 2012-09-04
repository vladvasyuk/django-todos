from todos.models import Task, Tag
from todos.forms import TaskForm, TagForm
from django.contrib.auth.models import User
from tastypie.resources import ModelResource,ALL,ALL_WITH_RELATIONS
from tastypie.authentication import SessionAuthentication
from tastypie.authorization import Authorization
from tastypie import fields
from tastypie.validation import FormValidation

class UserResource(ModelResource):
    class Meta:
        queryset = User.objects.all()
        excludes = ['email', 'password', 'is_active', 'is_staff', 'is_superuser']
        allowed_methods = ['get']

        filtering = {
            'username' : ALL
        }

class TagResource(ModelResource):
    user = fields.ForeignKey(UserResource,'user')
    total_tasks = fields.IntegerField()
    notcompleted_tasks = fields.IntegerField()

    class Meta:
        queryset = Tag.objects.all().order_by('-pk')
        authentication = SessionAuthentication()
        authorization = Authorization()
        validation = FormValidation(form_class=TagForm)

        filtering = {
            'value' : ALL_WITH_RELATIONS,
            'id' : ALL_WITH_RELATIONS
        }

    def dehydrate(self, bundle):
        bundle.data['total_tasks'] = bundle.obj.task_set.count()
        bundle.data['notcompleted_tasks'] = bundle.obj.task_set.filter(completed=False).count()
        return bundle

    def obj_create(self, bundle, request=None, **kwargs):
        return super(TagResource, self).obj_create(bundle, request, user=request.user)

    def apply_authorization_limits(self, request, object_list):
        return object_list.filter(user=request.user)

class TaskResource(ModelResource):
    user = fields.ForeignKey(UserResource,'user')
    tags = fields.ToManyField(TagResource,'tags',full=True,blank=True)

    class Meta:
        queryset = Task.objects.all().order_by('-priority','-pk')
        authentication = SessionAuthentication()
        authorization = Authorization()
        validation = FormValidation(form_class=TaskForm)

        filtering = {
            'user' : ALL_WITH_RELATIONS,
            'deadline' : ['exact','lt','gt'],
            'completed' : ALL,
            'tags' : ALL_WITH_RELATIONS
        }

    def hydrate(self,bundle):
        bundle.obj.user = bundle.request.user
        bundle.data['title'] = bundle.data['title'].strip()
        return bundle

    def obj_create(self, bundle, request=None, **kwargs):
        return super(TaskResource, self).obj_create(bundle, request, user=request.user)  

    def apply_authorization_limits(self, request, object_list):
        return object_list.filter(user=request.user)