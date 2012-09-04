# Django to-do application

Just simple django to-do app with remember-the-milk-like syntax for task adding. It uses Django+Tastypie at backend and Backbone.js+jQuery+Twitter Bootstrap at frontend.

## Dependencies

+ Django 1.4.1+ (https://github.com/django/django)
+ Tastypie 0.9.12 (https://github.com/toastdriven/django-tastypie)
+ Django-registration 0.8+ (https://bitbucket.org/ubernostrum/django-registration)

## Installation

+ For painless installation, create and activate virtualenv (optionally):
        
        $ virtualenv .env
        $ source .env/bin/activate

+ Use pip install:

        $ pip install git+https://github.com/nazgarth/django-todos

## Adding to the project

### settings.py

 Add application and it dependencies to `INSTALLED_APPS`:

```python
INSTALLED_APPS = (
    ...
    'django.contrib.admin', # if you want to turn on administration 
    'todos',
    'registration',
    'tastypie'
)
```

+ Add `API_LIMIT_PER_PAGE` tastypie constant:

```python
API_LIMIT_PER_PAGE = '0'
```

+ Configure your database settings and run syncdb:
        
        $ ./manage.py syncdb

### urls.py

+ Locate application and authentication urls

```python
urlpatterns = patterns('',
    url(
        r'^', # Modify if you don't want to see app at root of your project
        include('todos.urls'), 
        name='todo_app'
    ),
)

# Place account settings to /accounts/...
# Change anything here -- bad idea.
import registration.views
from django.core.urlresolvers import reverse_lazy
urlpatterns += patterns('',
    url(r'^accounts/register/$',
            registration.views.register,{
                'backend': 'registration.backends.simple.SimpleBackend',
                'success_url': reverse_lazy('todos.views.index')
            },
            name='registration_register' 
        ),
    url(r'^accounts/', include('registration.backends.simple.urls')),
)
```

+ For administration functions, include:

```python
from django.contrib import admin
admin.autodiscover()

urlpatterns += patterns('',
    url(r'^admin/', include(admin.site.urls)),
)
```

## Usage
Go to root of your site (if you don't changed todo_app url) and login/register. Functional how-to available at application main page.