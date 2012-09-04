from tastypie.api import Api
from resources import UserResource, TaskResource, TagResource

v1_api = Api(api_name='v1')
v1_api.register(UserResource())
v1_api.register(TaskResource())
v1_api.register(TagResource())