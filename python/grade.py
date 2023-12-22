import sys
import mysql.connector
import pandas as pd
import joblib
import numpy as np

sys.stdout.reconfigure(encoding='utf-8')

db_config = {
    'host': 'localhost',
    'user': 'root',
    'password': '1234',
    'database': 'credit',
    'charset': 'utf8',
}

connection = mysql.connector.connect(**db_config)
cursor = connection.cursor()

# 문자 인코딩 설정
cursor.execute('SET NAMES utf8;')
cursor.execute('SET CHARACTER SET utf8;')
cursor.execute('SET character_set_connection=utf8;')

# 첫 번째 쿼리 실행
sql_query = """
    SELECT gender, car, reality, child_num, income_type, edu_type, family_type, occyp_type,
           family_size, begin_month, Age, EMPLOYED, income_mean
    FROM user_grade
    ORDER BY idx DESC
    Limit 1
"""
cursor.execute(sql_query)
user_data = cursor.fetchall()

columns = ['gender', 'car', 'reality', 'child_num', 'income_type', 'edu_type', 'family_type', 'occyp_type', 'family_size', 'begin_month', 'Age', 'EMPLOYED', 'income_mean']
df_user_data = pd.DataFrame(user_data, columns=columns)

model = joblib.load('C:/Users/Admin/Desktop/main/최종web/python/random_forest_model.joblib')

predictions = model.predict(df_user_data)

result = ''
if predictions == 1:
    result = '낮습니다.'
elif predictions == 2:
    result = '높습니다.'

print(result)
