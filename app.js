
const express = require('express');
const ejs = require('ejs')
const app = express();
var bodyParser = require('body-parser')
var session = require('express-session')
const {spawn} = require('child_process')
const { spawnSync } = require('child_process');
const pythonProcess = spawnSync('python', ['./path/to/your/python/file.py']);
const python_transaction = pythonProcess.stdout.toString();



require('dotenv').config()

const mysql = require('mysql2');
const { write } = require('fs');
const connection = mysql.createConnection({
    host : 'localhost',
    user : 'root',
    password : '1234',
    database : 'credit'
})
console.log('Connected to Mysql')

//connection.query("SET time_zone = 'Asia/Seoul'")

app.listen(8080, function(){
   console.log('listening on 8080') 
});

app.set('vies engine', 'ejs')
app.set('views', './views')


app.use(bodyParser.urlencoded({extended:false}))
app.use(express.static(__dirname+'/public'))
app.use(session({secret:'credit', cookie:{
    maxAge:3600000}, resave:true, saveUninitialized:true
}))

app.use((req,res,next)=>{

    res.locals.user_id="";
    res.locals.name="";
    res.locals.email="";
    if(req.session.member){
        res.locals.user_id = req.session.member.user_id
        res.locals.name = req.session.member.name
        res.locals.email = req.session.member.email
    }
    next()
    
})

app.get('/', function(req, res){
    console.log(req.session.member);
    res.render('index.ejs')
});


// app.get('/', function(req, res){
//     res.render('index.ejs')
// });

app.get('/transaction', function (req, res) {
    res.render('card_transaction_history.ejs');
  });

// app.get('/recommend', (req, res) => {
//   res.render('recommend.ejs', { user_id: 'your_user_id', name: '사용자', categories });
// });

app.get('/card-details', (req, res) => {
  const selectedCategory = req.query.category;
  const cardDetails = getCardDetails(selectedCategory);
  res.render('card-details.ejs', { selectedCategory, cardDetails });
});

function getCardDetails(category) {
  // 선택한 카테고리에 기반하여 카드 세부 정보를 가져오는 로직으로 대체
  return { category, cardNumber: '1234 5678 9012 3456', expiryDate: '12/24', /* ... */ };
}




app.get('/transaction', (req, res) => {
    res.render('card_transaction_history.ejs')
});



app.get('/recommend', function(req, res) {
    var sql = `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'card_info' ORDER BY ORDINAL_POSITION LIMIT 28 OFFSET 1;`;
    connection.query(sql, function(err, results, fields) {
        if (err) throw err;

        // 처음 3개의 컬럼을 제외한 나머지 컬럼만 추출
        const categories = results.slice(3).map(row => row.COLUMN_NAME);

        res.render('recommend.ejs', { categories });
        console.log(categories);
    });
});


app.get('/grade', function(req, res){
    res.render('grade.ejs')
});

app.get('/contact', function(req, res){
    res.render('contact.ejs')
});

app.get('/login', function(req, res){
    res.render('login.ejs')
});

app.get('/register', function(req, res){
    res.render('register.ejs')
});
app.get('/translogin', function(req, res){
    res.render('translogin.ejs')
});
app.get('/transaction_graph', function(req, res){
    res.render('transaction_graph.ejs')
});
app.get('/transaction_search', function(req, res){
    res.render('transaction_search.ejs')
});


app.get('/recommendlogin', function(req, res){
    res.render('recommendlogin.ejs')
});
app.get('/gradelogin', function(req, res){
    res.render('gradelogin.ejs')
});

app.get('/grade_loading', function(req, res){
    res.render('grade_loading.ejs')
});


app.get('/grade_result', function(req, res){
    res.render('grade_result.ejs')
});

app.get('/trans_loading', function(req, res){
    res.render('trans_loading.ejs')
});




let globalTransactionData;
let globalcardinfoData;

function fetchDataFromCardInfo() {
    return new Promise((resolve, reject) => {
        var sql2 = `SELECT 
            상품명,
            전월실적,
            연회비,
            교통,
            주유,
            마트,
            쇼핑,
            푸드,
            배달,
            카페,
            뷰티,
            생활요금,
            의료,
            애완동물,
            자동차,
            스포츠,
            영화,
            항공,
            여행,
            해외,
            디지털구독,
            교육,
            기타
         FROM card_info`;
        connection.query(sql2, function(err, result2) {
            if (err) {
                reject(err);
            } else {
                resolve(result2);
            }
        });
    });
}

app.post('/transaction_searchProc', async (req, res) => {
    const email = req.session.member.email;

    try {
        // 첫 번째 쿼리
        var sql1 = `SELECT * FROM transaction WHERE email = '${email}' ORDER BY idx DESC LIMIT 1`;
        const result1 = await new Promise((resolve, reject) => {
            connection.query(sql1, function(err, result) {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });
        globalTransactionData = result1;

        // 두 번째 쿼리
        globalcardinfoData = await fetchDataFromCardInfo();

        // 로그 출력
        
        //console.log(globalcardinfoData);
        //console.log(string);
        const python = spawn('python',['./python/transaction.py']);
        const string = JSON.stringify(globalTransactionData);
        python.stdin.write(string);
        python.stdin.end();




        python.stdout.on('data', (output) => {
            const outputString = output.toString();
            const parsedData = JSON.parse(outputString);
            // console.log(parsedData)
            // Create a function to fetch card information for a category
            function fetchCardInfo(category) {
                return new Promise((resolve, reject) => {
                    const sql_img1 = `SELECT 카드사,링크,이미지 FROM card_info WHERE 상품명 = '${category.CreditCard}' `;
                    connection.query(sql_img1, function(err, result) {
                        if (err) {
                            reject(err);
                        } else {
                            // Create a new object with the desired structure
                            const combinedInfo = {
                                Rank: category.Rank,
                                CreditCard: category.CreditCard,
                                Score: category.Score,
                                Company: result[0].카드사,
                                link: result[0].링크,
                                img: result[0].이미지
                            };
                            resolve(combinedInfo);
                        }
                    });
                });
            }
        
            // 각 카테고리에 대한 카드 정보를 비동기적으로 조회
            const card_img_promises = parsedData.map(category => {
                // console.log(category.카드명);
                return fetchCardInfo(category);
            });
        
            // 모든 Promise가 완료될 때까지 기다린 후 결과를 렌더링
            Promise.all(card_img_promises)
                .then(combinedInfoArray => {
                    console.log(combinedInfoArray);
                    res.render('transaction_search.ejs', { combinedInfoArray });
                })
                .catch(error => {
                    console.error(error);
                    res.render('error.ejs'); // 에러 발생 시 에러 페이지 렌더링
                });
        });
        

    } catch (error) {
        console.error(error);
        // 오류 처리
    }
});




app.post('/gradeSearchProc', async (req, res) => {
        const python = spawn('python',['./python/grade.py']);
        

        python.stdout.on('data', (output) => {
            const outputString = output.toString().trim();
            console.log(outputString);
            res.render('grade_result.ejs', { outputString });
        });
        
        
});






app.post('/loginProc', (req, res) => {
    // const name = req.body.name;
    // const user_id = req.body.user_id;
    const email = req.body.email;
    const pw = req.body.pw;
    // const age = req.body.age;

    var sql = `select * from user where email=? and pw=?`
    
    var values = [email,pw];

    connection.query(sql, values, function(err, result){
        if(err) throw err;

        if(result.length==0){
            res.send("<script> alert('존재하지 않는 이메일이거나 비밀번호가 틀렸습니다.'); location.href='/login'</script>");
        } else{
            console.log(result[0]);

            req.session.member = result[0]

            res.send("<script> alert('로그인 되었습니다.'); location.href='/'</script>");
            //res.send(result);
        }
    })


});

app.post('/transloginProc', (req, res) => {
    // const name = req.body.name;
    // const user_id = req.body.user_id;
    const email = req.body.email;
    const pw = req.body.pw;
    // const age = req.body.age;

    var sql = `select * from user where email=? and pw=?`
    
    var values = [email,pw];

    connection.query(sql, values, function(err, result){
        if(err) throw err;

        if(result.length==0){
            res.send("<script> alert('존재하지 않는 이메일이거나 비밀번호가 틀렸습니다.'); location.href='/login'</script>");
        } else{
            console.log(result[0]);

            req.session.member = result[0]

            res.send("<script> alert('로그인 되었습니다.'); location.href='/transaction'</script>");
            //res.send(result);
        }
    })


});

app.post('/recommendProc', (req, res) => {
    const selectedCategories = req.body.selectedCategories;

    // Ensure selectedCategories is defined and not empty
    if (selectedCategories && selectedCategories.trim() !== "") {
        // Split the string into an array of categories
        const categoriesArray = selectedCategories.split(',');

        // Escape and sanitize the selectedCategories to prevent SQL injection
        const conditions = categoriesArray.map(category => `\`${category}\` = 1`).join(' AND ');
        const sql = `SELECT * FROM card_info WHERE ${conditions}`;

        connection.query(sql, function (err, result) {
            if (err) throw err;

            console.log(result);

            // 'result' 데이터를 app.locals에 저장
            app.locals.cardDetailResult = result;

            res.send("<script>location.href='/card-detail'</script>");
        });
    } else {
        res.send("<script> alert('선택된 카테고리가 없습니다.'); location.href='/recommend'</script>");
    }
});

app.get('/card-detail', function(req, res){
    // app.locals에서 'cardDetailResult' 데이터를 가져옴
    const result = app.locals.cardDetailResult;

    // 'result' 데이터를 전달하여 'card-detail.ejs' 템플릿을 렌더링
    res.render('card-detail.ejs', { result });
});


app.post('/recommendloginProc', (req, res) => {
    // const name = req.body.name;
    // const user_id = req.body.user_id;
    const email = req.body.email;
    const pw = req.body.pw;
    // const age = req.body.age;

    var sql = `select * from user where email=? and pw=?`
    
    var values = [email,pw];

    connection.query(sql, values, function(err, result){
        if(err) throw err;

        if(result.length==0){
            res.send("<script> alert('존재하지 않는 이메일이거나 비밀번호가 틀렸습니다.'); location.href='/login'</script>");
        } else{
            console.log(result[0]);

            req.session.member = result[0]

            res.send("<script> alert('로그인 되었습니다.'); location.href='/recommend'</script>");
            //res.send(result);
        }
    })


});

app.post('/gradeloginProc', (req, res) => {
    // const name = req.body.name;
    // const user_id = req.body.user_id;
    const email = req.body.email;
    const pw = req.body.pw;
    // const age = req.body.age;

    var sql = `select * from user where email=? and pw=?`
    
    var values = [email,pw];

    connection.query(sql, values, function(err, result){
        if(err) throw err;

        if(result.length==0){
            res.send("<script> alert('존재하지 않는 이메일이거나 비밀번호가 틀렸습니다.'); location.href='/login'</script>");
        } else{
            console.log(result[0]);

            req.session.member = result[0]

            res.send("<script> alert('로그인 되었습니다.'); location.href='/grade'</script>");
            //res.send(result);
        }
    })


});


app.get('/logout', (req, res) => {
    
    req.session.member = null;
    res.send("<script> alert('로그아웃 되었습니다.'); location.href='/'</script>");


});

app.post('/registerProc', (req, res) => {
    const name = req.body.name;
    const email = req.body.email;
    const pw = req.body.pw;

    var sql = `select * from user where email=?`
    
    var sql2 = `insert into user(name, email, pw)values(?,?,?)`
    
    var values1 = [email]
    var values = [name,email,pw];

    connection.query(sql, values1, function(err, result){
        if(err) throw err;
            // console.log(result[0])
            // console.log(err)
            console.log(values)
            console.log(result)
            
        if(result.length==0){
            console.log('회원가입 성공');
            connection.query(sql2,values,function(err, result){
                res.send("<script> alert('정상적으로 회원가입 되었습니다.'); location.href='/login'</script>");
            })
            
        }else if(email==result[0].email) {
            res.send("<script> alert('이미 가입된 이메일입니다.'); location.href='/login'</script>");
        }
    })


});

app.post('/transactionProc', (req, res) => {
    const email = req.session.member.email
    const 교통 = req.body.교통;
    const 주유 = req.body.주유;
    const 마트 = req.body.마트;
    const 쇼핑 = req.body.쇼핑;
    const 푸드 = req.body.푸드;
    const 배달 = req.body.배달;
    const 카페 = req.body.카페;
    const 뷰티 = req.body.뷰티;
    const 생활요금 = req.body.생활요금;
    const 의료 = req.body.의료;
    const 애완동물 = req.body.애완동물;
    const 자동차 = req.body.자동차;
    const 스포츠 = req.body.스포츠;
    const 영화 = req.body.영화;
    const 항공 = req.body.항공;
    const 여행 = req.body.여행;
    const 해외 = req.body.해외;
    const 디지털구독 = req.body.디지털구독;
    const 교육 = req.body.교육;
    const 기타 = req.body.기타;

    

    var sql = `insert into transaction(email,교통,주유,마트,쇼핑,푸드,배달,카페,뷰티,생활요금,의료,애완동물,자동차,스포츠,영화,항공,여행,해외,디지털구독,교육,기타) 
    values('${email}','${교통 || 0}','${주유 || 0}','${마트 || 0}','${쇼핑 || 0}','${푸드 || 0}','${배달 || 0}','${카페 || 0}','${뷰티 || 0}',
    '${생활요금 || 0}','${의료 || 0}','${애완동물 || 0}',
    '${자동차 || 0}','${스포츠 || 0}','${영화 || 0}','${항공 || 0}',
    '${여행 || 0}','${해외 || 0}','${디지털구독 || 0}','${교육 || 0}','${기타 || 0}' )`
    
    connection.query(sql, function(err, result){
        if(err) throw err;
        console.log('자료 1개를 삽입하였습니다.');
        res.send("<script> alert('정보가 등록되었습니다.'); location.href='/transaction_mydata'</script>");
    })


});





app.get('/transaction_mydata', (req,res)=>{
    const email = req.session.member.email;
    var sql = `SELECT * FROM transaction WHERE email = ? ORDER BY idx DESC LIMIT 1`;
    var values = [email]
    connection.query(sql,values,function(err,results,fields){
        if(err)throw err;
        
        res.render('transaction_mydata.ejs',{transaction:results})
        console.log(results)
    })
});

app.post('/gradeProc', (req, res) => {
    const email = req.session.member.email
    const gender = req.body.gender;
    const car = req.body.car;
    const reality = req.body.reality;
    const child_num = req.body.child_num;
    const income_type = req.body.income_type;
    const edu_type = req.body.edu_type;
    const family_type = req.body.family_type;
    const occyp_type = req.body.occyp_type;
    const family_size = req.body.family_size;
    const begin_month = req.body.begin_month;
    const Age = req.body.Age;
    const EMPLOYED = req.body.EMPLOYED;
    const income_mean = req.body.income_mean;
    // console.log(email,gender,car,reality,
    //     child_num,income_type,edu_type,family_type,occyp_type,
    //     family_size,begin_month,age,employed,income_mean)

    var sql = `insert into user_grade(email,gender,car,reality,child_num,income_type,edu_type,family_type,
        occyp_type,family_size,begin_month,Age,EMPLOYED,income_mean) 
    values('${email}','${gender}','${car}','${reality}','${child_num || 0}',
    '${income_type}','${edu_type}','${family_type}',
    '${occyp_type}','${family_size || 0}','${begin_month || 0}',
    '${Age || 0}','${EMPLOYED || 0}','${income_mean || 0}' )`
    
    connection.query(sql, function(err, result) {
        if (err) {
          console.error(err);
          res.send("<script> alert('잘못된 정보이거나 빈칸이 있습니다.'); window.history.go(-1); </script>");
        } else {
          console.log('자료 1개를 삽입하였습니다.');
          res.send("<script>  location.href='/grade_loading'; </script>");
        }
      });  
    
});

// app.get('/grade_mydata', (req,res)=>{
//     const email = req.session.member.email;
//     var sql = `SELECT * FROM user_grade WHERE email = ? ORDER BY idx DESC LIMIT 1`;
//     var values = [email]
//     connection.query(sql,values,function(err,results,fields){
//         if(err)throw err;
        
//         res.render('grade_mydata.ejs',{grade:results})
//         console.log(results)
//     })
// });