from django.db import models

# Create your models here.
class Query(models.Model):
	query_id = models.IntegerField(default=0)
	query_text = models.CharField(max_length=200)
	query_narrative = models.CharField(max_length=1000, blank=True )
	query_tc = models.CharField(max_length=200,blank=True)
	def __str__(self):
		return str(self.query_id)