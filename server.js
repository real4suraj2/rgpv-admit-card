//https://www.rgpv.ac.in/Login/StudentLogin.aspx
function pausecomp(millis) {
	var date = new Date();
	var curDate = null;
	do { curDate = new Date(); }
	while (curDate - date < millis);
}
const Tesseract = require('tesseract.js');
const worker = new Tesseract.TesseractWorker();
var request = require("request");
var cheerio = require("cheerio");
const md5 = require('md5');
var express = require("express");
var app = express();
const port = process.env.PORT || 3000;
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "https://lnct.herokuapp.com");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PATCH, PUT, DELETE, OPTIONS"
  );
  next();
});
function ocr(img) {
	return new Promise((resolve, reject) => {
		worker.recognize(img)
			.catch(err => reject(err))
			.then(result => {

				var text = result.text.replace(/[^a-zA-Z0-9]/g, "");
				text = text.slice(0, text.length);
				text = text.toUpperCase();
				console.log(text);
				if (text.length < 5)
					reject();
				resolve(text);
			})

	})

}
var hashedPassword = '';
var login;
var cookie = request.jar();
app.get('/', (req,r) => {
	try{
		if(req.headers.origin=='https://lnct.herokuapp.com')
		{	
	request({
		url: 'http://www.rgpv.ac.in/Login/StudentLogin.aspx',
		jar: cookie
	}, (error, response, body) => {
		var $ = cheerio.load(body);
		try {
			var img = $("img")
			img = 'https://www.rgpv.ac.in/Login/' + String(img['2'].attribs.src);
			var signIn = $('input[name="ctl00$ContentPlaceHolder1$uc_UserLogin1$imgLogin"]').prop("onclick");
			signIn = String(signIn).split('').splice(14).join('');
			var index = signIn.indexOf(')');
			signIn = signIn.substring(0, index - 1);
			var viewState = $("input[id='__VIEWSTATE']").val();
			var viewStateGenerator = $("input[id='__VIEWSTATEGENERATOR']").val();
			hashedPassword = md5(md5(req.query.password) + ":" + signIn);
			ocr(img).then(captcha => {
				login = {
					"ctl00$ScriptManager1": "ctl00$ContentPlaceHolder1$uc_UserLogin1$UpdPnlLogin|ctl00$ContentPlaceHolder1$uc_UserLogin1$imgLogin",
					"__LASTFOCUS": "",
					"__EVENTTARGET": "",
					"__EVENTARGUMENT": "",
					"__VIEWSTATE": viewState,
					"__VIEWSTATEGENERATOR": viewStateGenerator,
					"ctl00$ContentPlaceHolder1$uc_UserLogin1$txtUserName": req.query.username,
					"txtPassword1": "",
					"ctl00$ContentPlaceHolder1$uc_UserLogin1$txtPassword": hashedPassword,
					"ctl00$ContentPlaceHolder1$uc_UserLogin1$txtCaptcha": captcha,
					"ctl00$ContentPlaceHolder1$csrfval": "",
					"__ASYNCPOST": "false",
					"ctl00$ContentPlaceHolder1$uc_UserLogin1$imgLogin": "Sign In"
				};
				pausecomp(3000);
				request({
					url: 'https://www.rgpv.ac.in/Login/StudentLogin.aspx',
					jar: cookie, method: "POST", form: login
				}, (error, response, body) => {
					request({ url: "https://www.rgpv.ac.in/StudentLife/Studenthome.aspx", jar: cookie }, (error, response, body) => {
						request({ url: 'https://www.rgpv.ac.in/StudentLife/StudentReportMaster.aspx?url=View%20Reports', jar: cookie }, (error, response, body) => {
							var $ = cheerio.load(body);
							var viewState = $("input[id='__VIEWSTATE']").val();
							var viewStateGenerator = $("input[id='__VIEWSTATEGENERATOR']").val();
							var login = {
								"ctl00$ScriptManager2": "ctl00$ContentPlaceHolder1$UpdatePanel1|ctl00$ContentPlaceHolder1$btnView",
								"ctl00$ContentPlaceHolder1$csrfval": "466331941",
								"ctl00$ContentPlaceHolder1$drpReport": "2",
								"ctl00$ContentPlaceHolder1$S_month": "042019",
								"ctl00$ContentPlaceHolder1$drpsemster": "2",
								"ctl00$csrfval": "466331941",
								"__EVENTTARGET": "",
								"__EVENTARGUMENT": "",
								"__LASTFOCUS": "",
								"__VIEWSTATE": viewState,
								"__VIEWSTATEGENERATOR": viewStateGenerator,
								"__ASYNCPOST": "false",
								"ctl00$ContentPlaceHolder1$btnView": "View"
							}
							//r.send(body);
							//pausecomp(3000);
							request({ url: 'https://www.rgpv.ac.in/StudentLife/StudentReportMaster.aspx?url=View%20Reports', jar: cookie , method: "POST", form: login }, (error, response, body)=>{
							request({ url: 'https://www.rgpv.ac.in/StudentLife/rpt_ExaminationAdmitCard.aspx', jar: cookie}, (error, response, body) => {
								var $ = cheerio.load(body);
								var pic = 'https://www.rgpv.ac.in/ashx/StudentPicture.ashx?imgid=' + String($("#hdSessionValue").attr('value'));
								//console.log(pic);
								var sign = 'https://www.rgpv.ac.in' + String($('#Image2').attr('src')).slice(2);
								var logo = 'https://www.rgpv.ac.in' + String($('#Image1').attr('src')).slice(2);
								$('#imgPic').attr('id',"refinedPicture");
								$('#refinedPicture').attr('src',pic);
								$('#Image2').attr('src', sign);
								$('#Image1').attr('src', logo);
								//fs.writeFileSync('test.html',$.html());
									var html = $.html();							
								  r.send(html);
							})
							})
						})
					})
				})
			}).catch(e => console.log(e));
		}
		catch{
			console.log(error);
		}
	});
	}
	else
		r.status(404).send("NOT Authorized!!")
	}
	catch{
		r.status(404).send("NOT Authorised!!")
	}
})
app.listen(port, () => {
	console.log("Server started on port " + port);
});
