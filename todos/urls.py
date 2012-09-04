from django.conf.urls import patterns, include, url
from django.contrib.staticfiles.urls import staticfiles_urlpatterns
from todos.api import v1_api

urlpatterns = patterns('',
    url(r'^$', 'todos.views.index'),
    (r'^api/', include(v1_api.urls)),
)