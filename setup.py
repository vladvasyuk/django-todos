#!/usr/bin/env python
# -*- coding: utf-8 -*-
try:
    from setuptools import setup
except ImportError:
    from ez_setup import use_setuptools
    use_setuptools()
    from setuptools import setup


setup(
    name='django-todos',
    version='0.1.0',
    description='Simple to-do app for Django.',
    author='Vasyuk Vladislav',
    author_email='nazgarth@gmail.com',
    url='http://github.com/nazgarth/django-todos/',
    long_description=open('README.md', 'r').read(),
    packages=[
        'todos',
        'todos.api',
    ],
    package_data={
        'todos': [
            'templates/registration/*',
            'templates/todos/*',
            'static/todos/js/*.js',
            'static/todos/js/backbone/*',
            'static/todos/bootstrap/js/*',
            'static/todos/bootstrap/css/*',
            'static/todos/bootstrap/img/*',
            'static/todos/css/*',
        ],
    },
    zip_safe=False,
    dependency_links=[
        'https://github.com/toastdriven/django-tastypie/tarball/master#egg=django-tastypie-0.9.12'
    ],
    install_requires=[
        'django==1.4.1',
        'django-tastypie>=0.9.12',
        'django-registration==0.8',
    ],
)