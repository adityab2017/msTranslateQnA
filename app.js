var restify = require('restify');
var builder = require('botbuilder');
var cognitiveservices = require('./lib/botbuilder-cognitiveservices');
require('dotenv-extended').load();

var qna_KBid        = process.env.QNA_KBID,                             
    qna_Subs_Key    = process.env.QNA_SUBS_KEY,
    luis_App_Key    = process.env.LUIS_APP_KEY,
    luis_Subs_Key   = process.env.LUIS_SUBS_KEY,
    translate_Key   = process.env.MICROSOFT_TRANSLATOR_KEY;

//=========================================================
//Setup Translator
//=========================================================

var client = new translator({
    api_key: translate_Key 
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
// Recognizers
//=========================================================

var qnarecognizer = new cognitiveservices.QnAMakerRecognizer({
    knowledgeBaseId: qna_KBid, 
    subscriptionKey: qna_Subs_Key,
    top: 4});

//var model = 'set your luis model uri';
//var recognizer = new builder.LuisRecognizer(model);

var recognizer = new builder.LuisRecognizer('https://westus.api.cognitive.microsoft.com/luis/v2.0/apps/' + luis_App_Key + '?subscription-key=' + luis_Subs_Key + '&verbose=true&timezoneOffset=0&q=');


//=========================================================
// Bots Dialogs
//=========================================================

var recognizer = new cognitiveservices.QnAMakerRecognizer({
    knowledgeBaseId: qna_KBid,
    subscriptionKey: qna_Subs_Key
});

var basicQnAMakerDialog = new cognitiveservices.QnAMakerDialog({
    recognizers: [recognizer],
    defaultMessage: 'No match! Try changing the query terms!',
    qnaThreshold: 0.3
});

bot.dialog('/', basicQnAMakerDialog);


//=========================================================
// Bot Dialogs
//=========================================================
//var intents = new builder.IntentDialog({ recognizers: [recognizer, qnarecognizer] });
//bot.dialog('/', intents);

//intents.matches('luisIntent1', builder.DialogAction.send('Inside LUIS Intent 1.'));

//intents.matches('luisIntent2', builder.DialogAction.send('Inside LUIS Intent 2.'));

//intents.matches('qna', [
//    function (session, args, next) {
//        var answerEntity = builder.EntityRecognizer.findEntity(args.entities, 'answer');
//        session.send(answerEntity.entity);
//    }
//]);

//intents.onDefault([
//    function(session){
//        session.send('Sorry!! No match!!');
//	}
//]);