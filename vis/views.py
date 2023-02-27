from django.http import HttpResponse, JsonResponse
from django.template import loader
from django.shortcuts import render
from vis.models import Query
import os
from django.conf import settings # STATIC_ROOT

import pandas as pd
import numpy as np
import scipy.stats as stats
from statsmodels.stats.meta_analysis import (
    effectsize_smd,
    effectsize_2proportions,
    combine_effects,
    _fit_tau_iterative,
    _fit_tau_mm,
    _fit_tau_iter_mm,
)
import json


def index(request):
	if request.method == "POST":
		if 'metric' in request.POST:
			metric = request.POST['metric']
		else: 
			metric = 'map'

		if 'systems' in request.POST:
			systems = json.loads(request.POST['systems'])
		else: 
			systems = []

		if 'sys_test' in request.POST:
			sys_test = request.POST['sys_test']
		else: 
			sys_test = ''
		
		if 'sys_bl' in request.POST:
			sys_bl = request.POST['sys_bl']
		else: 
			sys_bl = ''
		
		if 'round' in request.POST:
			round = request.POST['round']
			data_all = get_round_trec_eval_std(round, metric, systems, sys_test, mean = False)
			data_raw = data_all['raw']
			data_normal = data_all['normal']
			data_uniform = data_all['uniform']

		else: 
			round = 'round1'
		
		n_q = 30
		data_s2 = {}
		data_metaev = {} #{'s': [[r,m,v,n],], }

		data_extra = {'kind': 'queries'}

		if 'list_rounds' in request.POST:
			list_rounds = json.loads(request.POST['list_rounds'])
			resp_type = 'rounds'
			data_extra['kind'] = resp_type
			data = {} #{sys:{rr:val, rr2:val, }}
			data_s2 = {}
			data_normal = {}
			data_uniform = {}
			 
			for round in list_rounds:
				round_m_s2 =  get_round_trec_eval_std(round['id'], metric, systems, sys_test, mean =True)
				round_mean =  round_m_s2['raw']['mean']
				round_s2 =  round_m_s2['raw']['s2']

				round_normal = round_m_s2['normal']
				round_uniform = round_m_s2['uniform']

				if resp_type == 'rounds':
					if len(data) == 0:  #x-axis: qid
						for key, value in round_mean.items(): #raw values
							data[key] = {round['id']: value}
							data_s2[key] = {round['id']: round_s2[key]}
							data_metaev[key] = [[round['id'], value, round_s2[key], n_q]]
						for key, value in round_normal.items(): #normal-values
							data_normal[key] = {round['id']: value}
						for key, value in round_uniform.items(): #uniform-values
							data_uniform[key] = {round['id']: value}
					else:  # x-axis: qid
						for key, value in round_mean.items(): #raw values
							data[key][round['id']] = value
							data_s2[key][round['id']] = round_s2[key]
							data_metaev[key].append([round['id'], value, round_s2[key], n_q])
						for key, value in round_normal.items(): #normal-values
							data_normal[key][round['id']] = value
						for key, value in round_uniform.items(): #uniform-values
							data_uniform[key][round['id']] = value
				else: #responce_type == 'systems' {rr:{sys:val, sys2:val, }}
					data[round['id']] = round_mean 
					data_s2[round['id']] = round_s2 
					data_normal[round['id']] = round_normal 
					data_uniform[round['id']] = round_uniform 

			data_raw = data
			## Meta-Analysis sys_test vs sys_bl
			data_metaev = get_metaEval(data_metaev, sys_test, sys_bl) 

		return JsonResponse({
			'results': data_raw, 
			'results_s2':data_s2,
			'data_me':data_metaev,
			'extra': data_extra,
			'results_normal': data_normal,
			'results_uniform': data_uniform }, safe=False)
	
	
	eval_path = 'static/evaluation/'
	context = initial_evaluation(eval_path)

	return render(request, 'vis/index.html', context)


def queries(request):
	if request.method == "POST": 
		if 'type' in request.POST:
			eval_type = request.POST['type'] #rounds or systems; 
			post_data = request.POST
			print(post_data, eval_type)
			json_response = evaluate_queries(eval_type, post_data)
			return JsonResponse(json_response, safe=False)

	context = initial_evaluation()
	return render(request, 'vis/queries.html', context)



def systems(request):
	context = initial_evaluation()
	return render(request, 'vis/systems.html', context)


def initial_evaluation(eval_path='static/evaluation/'):

	rounds = np.sort(os.listdir(eval_path))
	df_eval = get_eval_trec_eval(rounds[-1:][0])
	systems =  list(df_eval.columns[2:])

	systems_list = [{'id':systems[x], 'name': systems[x]} for x in range(len(systems))]

	ees_list = [{'id':rounds[x], 'name': rounds[x]} for x in range(len(rounds))]

	sys = systems[0] 

	evaluation_data = {
        'ees_list': ees_list,
		'df_dict': df_eval.to_json(), 
		'systems': systems, 
		'queries': list(df_eval['qid'].unique()), 
		'metrics': df_eval['metric'].unique(), 
		'metric':  df_eval['metric'].unique()[3],
		'system': sys, 
		'df_sys': df_eval[df_eval['metric']=='map'][[sys, 'qid']].set_index('qid').to_json()
    }

	return evaluation_data


def ee_detail(request, ee):
	df_eval = get_eval(ee)
	context = {
        'df': df_eval,
		'html_data': df_eval.head(10).to_html()
    }
	return render(request, 'vis/ee_detail.html', context)

def evaluate_queries(type, data):
	#general data
	metric = data['metric']
	sys_test = data['sys_test']

	n_q = 30
	data_s2 = {}
	data_metaev = {} #{'s': [[r,m,v,n],], }
	data_extra = {'kind': 'queries'}
	data_raw = {}
	data_normal = {}
	data_uniform = {}

	if type == 'qids_round': #several systems, one round. 
		#Data
		# sys_bl = data['sys_bl']
		round = data['round']
		systems = json.loads(data['systems'])

		#metrics
		data_all = get_round_trec_eval_std(round, metric, systems, sys_test, mean = False)
		data_raw = data_all['raw']
		data_normal = data_all['normal']
		data_uniform = data_all['uniform']

		
	else: #type == 'qids_system' 
		list_rounds = json.loads(data['list_rounds'])
		systems = json.loads(data['systems'])

		for round in list_rounds:
			round_m_s2 =  get_round_trec_eval_std(round['id'], metric, systems, sys_test)
			round_mean =  round_m_s2['raw'][sys_test]
			# round_s2 =  round_m_s2['raw']['s2']
			# print("HERE", round, round_m_s2)
			round_normal = round_m_s2['normal'][sys_test]
			round_uniform = round_m_s2['uniform'][sys_test]

			data_raw[round['id']] = round_mean 
			data_normal[round['id']] = round_normal 
			data_uniform[round['id']] = round_uniform 
		print()


	return {
			'results': data_raw, 
			'results_s2':data_s2,
			'data_me':data_metaev,
			'extra': data_extra,
			'results_normal': data_normal,
			'results_uniform': data_uniform }


def get_eval(ee): 
	"""
	Files in csv dataFrame format from static eval/ folder
	"""
	eval_name = 'systems_evaluation_index_' + str(ee) 
	df = pd.read_csv(settings.STATIC_ROOT + 'eval/'+ eval_name +'.csv')
	return df 

def get_eval_trec_eval(round):
	"""
	Read all systems trec-eval files from static/evaluation/round folder. 
	trec-eval runid is the name of the system. systems from different rounds are groupd by runid. 
	"""
	dfround = pd.DataFrame()
	round_path = settings.STATIC_ROOT + 'evaluation/' + round
	systems = os.listdir(round_path)

	for sys in systems:
		dfsys = pd.read_csv(round_path +'/'+ sys, sep='\t', header=None, names=[ "metric", "qid", "value"])
		sys_name = dfsys[dfsys['metric']=='runid']['value'].iloc[0]
		
		dfsys = dfsys.rename(columns={'value':sys_name})
		dfsys = dfsys[dfsys['qid']!='all']
		dfsys[sys_name] = dfsys[sys_name].astype(float)
		if len(dfround) == 0:
			dfround = dfsys
		else:
			dfround = dfround.merge(dfsys)

	dfround = dfround[dfround['qid']!='all']

	return dfround

def get_round(rr, met, ss):
	"""
	Files in csv dataFrame format from static eval/ folder
	rr: round name
	met: metric 
	ss: set of systems
	"""
	df_eval = get_eval(rr)
	if len(ss) == 0:
		ss = list(df_eval.columns[3:])
		ss = [ss[0]] 
	return  df_eval[df_eval['metric']==met][ss + ['qid']].set_index('qid').to_dict()

def get_round_trec_eval(round, metric, systems):
	"""
	Get dataframe for a specific set of systems.
	round: round name
	metric: metric 
	systems: set of systems or empty []
	"""
	df_eval = get_eval_trec_eval(round)
	df_eval = df_eval[df_eval['qid']!='all']
	if len(systems) == 0:
		systems = list(df_eval.columns[2:])
		systems = [systems[0]] 
	
	# print('get_round',systems)
	return  df_eval[df_eval['metric']==metric][systems + ['qid']].set_index('qid').to_dict()


def get_round_trec_eval_std(rr, metric, systems, st, mean = False): 
	"""
	get raw and std values a round.
	rr: round name
	metric: evaluation metric 
	systems: list set of systems
	mean: if True, compute mean performance across topics;
	"""

	#systems as baselines; 
	systems_all = systems 
	systems_test = systems
	# if st in systems_test:
	# 	systems_test.remove(st)

	return_data = {}
	df_eval = get_eval_trec_eval(rr)
	df_eval = df_eval[df_eval['metric']==metric]
	
	if mean : 
		rr_mean = df_eval[systems_all].mean().to_dict()
		rr_s2 = df_eval[systems_all].std().to_dict()		
		return_data['raw'] = {'mean': rr_mean, 's2': rr_s2}
		df_eval = df_eval[['qid'] + systems_test + [st]].set_index('qid')
	else:
		df_eval = df_eval[['qid'] + systems_test + [st]].set_index('qid')
		return_data['raw'] = df_eval.to_dict()
	
	df_eval = df_eval.T

	#mu, sigma query by query;
	#compute the std function with baseline systems	
	mu = df_eval.loc[systems_test].mean()
	sigma = df_eval.loc[systems_test].std()
	qids = list(df_eval.columns)


	dict_values_n = {}
	dict_values_u = {}
	for qid in qids:
		if sigma[qid] != 0:
			std_values = std_by_qid(df_eval[qid], mu[qid], sigma[qid], qid, A=.15,B=.5)
			dict_values_n[qid] = std_values['normal']
			dict_values_u[qid] = std_values['uniform']
		else: 
			dict_values_n[qid] = df_eval[qid].values
			dict_values_u[qid] = df_eval[qid].values
	
	#get values of system in std function for ss systems and st system. 
	if mean : 
		mean_qids_n = pd.DataFrame(dict_values_n, index=df_eval.index).T.mean().to_dict()
		mean_qids_u = pd.DataFrame(dict_values_u, index=df_eval.index).T.mean().to_dict()
		return_data['normal'] = mean_qids_n
		return_data['uniform'] = mean_qids_u
	else: 
		qids_dict_n = pd.DataFrame(dict_values_n, index=df_eval.index).T.to_dict()
		qids_dict_u = pd.DataFrame(dict_values_u, index=df_eval.index).T.to_dict()
		return_data['normal'] = qids_dict_n
		return_data['uniform'] = qids_dict_u

	return return_data


def get_metaEval(dataME, st, sb) : 
	"""
	code from: https://www.statsmodels.org/dev/examples/notebooks/generated/metaanalysis1.html
	"""

	trait = dataME[st]
	baseline = dataME[sb]
	data = [trait[r] + baseline[r][1:] for r in range(len(trait))]

	colnames = ["study", "mean_t", "sd_t", "n_t", "mean_c", "sd_c", "n_c"]
	rownames = [i[0] for i in data]
	dframe1 = pd.DataFrame(data, columns=colnames)
	mean2, sd2, nobs2, mean1, sd1, nobs1 = np.asarray(
		dframe1[["mean_t", "sd_t", "n_t", "mean_c", "sd_c", "n_c"]]
	).T
	rownames = dframe1["study"]

	eff, var_eff = effectsize_smd(mean2, sd2, nobs2, mean1, sd1, nobs1)
	res3 = combine_effects(eff, var_eff, method_re="dl", use_t=True, row_names=rownames)
	res3.conf_int_samples(nobs=np.array(nobs1 + nobs2))

	return {'data':dframe1.T.to_json(), 'meta':  res3.summary_frame().T.to_json()}


def get_round_std(rr, met, ss, st): 

	df_eval = get_eval(rr)
	df_eval = df_eval[df_eval['metric']==met][['qid']+ss+[st]]
	df_eval = df_eval.set_index('qid').T
	
	#mu, sigma query by query;
	#compute the std function with ss systems
	mu = df_eval.loc[ss].mean()
	sigma = df_eval.loc[ss].std()
	qids = list(df_eval.columns)

	dict_values_n = {}
	dict_values_u = {}
	for qid in qids:
		if sigma[qid] != 0:
			# std_by_qid(perf_values, m, s, qid, A=.15,B=.5)	
			std_values = std_by_qid(df_eval[qid], mu[qid], sigma[qid], qid, A=.15,B=.5)
			dict_values_n[qid] = std_values['normal']
			dict_values_u[qid] = std_values['uniform']
		else: 
			dict_values_n[qid] = df_eval[qid].values
			dict_values_u[qid] = df_eval[qid].values
	
	#get values of system in std function for ss systems and st system. 
	qids_dict_n = pd.DataFrame(dict_values_n, index=df_eval.index).T.to_dict()
	qids_dict_u = pd.DataFrame(dict_values_u, index=df_eval.index).T.to_dict()
	return {'normal': qids_dict_n, 'uniform': qids_dict_u} 


def get_round_mean(rr, met, ss, s2 = ''):
	df_eval = get_eval(rr)
	if len(ss) == 0:
		ss = list(df_eval.columns[3:])
		ss = [ss[0]]
	rr_mean = df_eval[df_eval['metric']==met][ss].mean().to_dict()
	rr_s2 = df_eval[df_eval['metric']==met][ss].std().to_dict()
	# print("x:", df_eval[df_eval['metric']==met][ss + ['qid']])
	return  {'mean': rr_mean, 's2': rr_s2}

def get_round_mean_std(rr, met, ss, st): 

	df_eval = get_eval(rr)
	df_eval = df_eval[df_eval['metric']==met][['qid']+ss+[st]]
	df_eval = df_eval.set_index('qid').T
	
	#mu, sigma query by query;
	#compute the std function with ss systems
	mu = df_eval.loc[ss].mean()
	sigma = df_eval.loc[ss].std()
	qids = list(df_eval.columns)

	dict_values_n = {}
	dict_values_u = {}
	# print(df_eval.index)
	for qid in qids:
		if sigma[qid] != 0:
			# std_by_qid(perf_values, m, s, qid, A=.15,B=.5)	
			std_values = std_by_qid(df_eval[qid], mu[qid], sigma[qid], qid, A=.15,B=.5)
			dict_values_n[qid] = std_values['normal']
			dict_values_u[qid] = std_values['uniform']
		else: 
			dict_values_n[qid] = df_eval[qid].values
			dict_values_u[qid] = df_eval[qid].values
	
	#get values of system in std function for ss systems and st system. 
	# qids_dict = pd.DataFrame(dict_values, index=df_eval.index).T.to_dict()
	mean_qids_n= pd.DataFrame(dict_values_n, index=df_eval.index).T.mean().to_dict()
	mean_qids_u= pd.DataFrame(dict_values_u, index=df_eval.index).T.mean().to_dict()

	return {'normal': mean_qids_n, 'uniform': mean_qids_u} 

def std_by_qid(perf_values, m, s, qid, A=.15,B=.5):
    
    n = stats.norm.cdf(perf_values, m, s)
    u = stats.uniform.cdf(perf_values, m - (s*B/A), m + s*(1-B)/A )
    # z = stats.zscore(perf_values)
    
    return {'normal': n, 'uniform': u}