import sys
import mysql.connector
import pandas as pd
import numpy as np
import json
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
sql_query = "SELECT 카드사, 상품명, 전월실적, 모든가맹점, 교통, 주유, 마트, 쇼핑, 푸드, 배달, 카페, 뷰티, 생활요금, 의료, 애완동물, 자동차, 스포츠, 영화, 간편결제, 항공, 프리미엄, 여행, 해외, 디지털구독, 멤버십, 교육, 금융, 기타, 링크, 이미지, score, 연회비 FROM card_info"
cursor.execute(sql_query)
result_card_info = cursor.fetchall()

# 두 번째 쿼리 실행
sql_query2 = "SELECT * FROM transaction ORDER BY idx DESC LIMIT 1"
cursor.execute(sql_query2)
result_transaction = cursor.fetchall()

# 데이터프레임 생성
df_card_info = pd.DataFrame(result_card_info)
df_transaction = pd.DataFrame(result_transaction)

# print("Card Info:")
# print(df_card_info.head())
# print(df_card_info.info())

# print("\nTransaction:")
# print(df_transaction.head())
# print(df_transaction.info())



###################################################################
# 예시 사용

card = df_card_info[df_card_info[2] <= df_transaction[22].min()]

card = card.drop([0,3,18,20,24,26,28,29], axis=1)
# print(card_data)

user = df_transaction.drop([0,1], axis=1)
user = np.where(user * 0.05 >= 5000, 5000, user * 0.05)
user = np.array(user[:, :-1]).flatten()  # 'total' 제외

class CreditCardRecommendation:
    def __init__(self, card_data):
        self.card_data = card_data
        self.benefit_matrix = np.array(self.card_data.drop([1,2,30,31], axis=1).values, dtype=np.float64).T
        self.card_indices_and_ranks = None  # 클래스 속성으로 선언

    def recommend_credit_cards(self, user_spending_totals, num_recommendations=10):
        user_vector = np.array(user_spending_totals)

        # 각 카드에 대한 혜택 점수 계산 (카드 혜택이 1인 경우에만 점수 부여)
        benefit_scores = np.dot(user_vector, self.benefit_matrix)

        # 가장 높은 점수를 가진 카드들의 인덱스와 순위를 추출
        self.card_indices_and_ranks = list(enumerate(benefit_scores, 1))

        # 연회비와 전월실적이 낮은 순서로 정렬
        self.card_indices_and_ranks = sorted(self.card_indices_and_ranks, key=lambda x: (self.card_data.iloc[x[0] - 1][30], self.card_data.iloc[x[0] - 1][2],  self.card_data.iloc[x[0] - 1][1]))

        # Score를 기준으로 내림차순으로 정렬
        self.card_indices_and_ranks.sort(key=lambda x: x[1], reverse=True)

        # 각 카드 정보를 딕셔너리로 묶어서 반환
        recommended_cards = [{
            'Rank': rank,
            'CreditCard': self.card_data.iloc[index - 1][1],
            'Score': '{:,.0f}'.format(score)
        } for rank, (index, score) in enumerate(self.card_indices_and_ranks, 1)]

        return recommended_cards[:num_recommendations], self.card_indices_and_ranks

# 예시 데이터
card_data = card
user_spending_totals = user

recommendation_system = CreditCardRecommendation(card_data)
recommended_cards_list, card_ranks = recommendation_system.recommend_credit_cards(user_spending_totals, num_recommendations=30)

# 리스트 출력
# print(recommended_cards_list)

# # JSON 문자열 출력

json_data = json.dumps(recommended_cards_list, ensure_ascii=False)

# JSON 문자열 출력
print(json_data)

# 연결 및 커서 닫기
cursor.close()
connection.close()