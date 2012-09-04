from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import m2m_changed
from django.dispatch import receiver

class Tag(models.Model):
    value = models.CharField(max_length=20,blank=False)
    user = models.ForeignKey(User)

    def __unicode__(self):
        return self.value

class Task(models.Model):
    title = models.CharField(max_length=255,blank=False)
    taskstring = models.CharField(max_length=255,blank=False)
    priority = models.IntegerField(blank=True,null=True,default=1)
    date_completed = models.DateField('Date completed',null=True,blank=True)
    deadline = models.DateField('Deadline',null=True,blank=True)
    completed = models.BooleanField('Completed',blank=True)
    tags = models.ManyToManyField(Tag,blank=True)
    user = models.ForeignKey(User)

    def __unicode__(self):
        return self.title

    # def _remove_orphan_tags(self):
    #     orphan_tags = Tag.objects.annotate(models.Count('task')).filter(task__count=0)
    #     orphan_tags.delete()

    # def save(self,*args,**kwargs):
    #     super(Task,self).save(*args,**kwargs)
    #     self._remove_orphan_tags()