//Final Working version for Marija
var restify             = require('restify');
var builder             = require('botbuilder');
var cognitiveservices   = require('./lib/botbuilder-cognitiveservices');
var translator = require('mstranslator');
var toLang              = 'sr';


//Setup Translator
var client = new translator({
    api_key: 'ed62ab114c014e70830fc29474ea72fd' // use this for the new token API. 
}, true);

//=========================================================
// Bot Setup
//=========================================================

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url); 
});
  
// Create chat bot
var connector = new builder.ChatConnector({
 appId: process.env.MICROSOFT_APP_ID,
 appPassword: process.env.MICROSOFT_APP_PASSWORD
});
var bot = new builder.UniversalBot(connector);
server.post('/api/messages', connector.listen());

//=========================================================
// Bots Dialogs
//=========================================================

var recognizer = new cognitiveservices.QnAMakerRecognizer({
    knowledgeBaseId: 'c7634bcb-a61e-4473-8f86-44347e1e4c9e',
    subscriptionKey: '47e2641a113545c3bd057cf8c6618bdd',
	top: 4});

var qnaMakerTools = new cognitiveservices.QnAMakerTools();
bot.library(qnaMakerTools.createLibrary());
	
var basicQnAMakerDialog = new cognitiveservices.QnAMakerDialog({
	recognizers: [recognizer],
	defaultMessage: 'No match! Try changing the query terms!',
	qnaThreshold: 0.3,
	feedbackLib: qnaMakerTools
});

// Override to also include the knowledgebase question with the answer on confident matches
basicQnAMakerDialog.respondFromQnAMakerResult = function(session, qnaMakerResult){
	var result = qnaMakerResult;
    var response = 'Here is the match from FAQ:  \r\n  Q: ' + result.answers[0].questions[0] + '  \r\n A: ';
    var faqAnswer = JSON.stringify(result.answers[0].answer);
    var transAns = faqAnswer;
    if (toLang) {
        var paramsTranslate = {
            text: faqAnswer,
            from: 'en',
            to: toLang
        };
        client.translate(paramsTranslate, function (err, dataDefault) {
            session.sendTyping();
            response += dataDefault;
            session.send(response);
        })
    } else {
        response += faqAnswer;
        session.send(response);
    };
}

// Override to log user query and matched Q&A before ending the dialog
basicQnAMakerDialog.defaultWaitNextMessage = function(session, qnaMakerResult){
	if(session.privateConversationData.qnaFeedbackUserQuestion != null && qnaMakerResult.answers != null && qnaMakerResult.answers.length > 0 
		&& qnaMakerResult.answers[0].questions != null && qnaMakerResult.answers[0].questions.length > 0 && qnaMakerResult.answers[0].answer != null){
			console.log('User Query: ' + session.privateConversationData.qnaFeedbackUserQuestion);
			console.log('KB Question: ' + qnaMakerResult.answers[0].questions[0]);
			console.log('KB Answer: ' + qnaMakerResult.answers[0].answer);
		}
	session.endDialog();
}

bot.dialog('/', basicQnAMakerDialog);

