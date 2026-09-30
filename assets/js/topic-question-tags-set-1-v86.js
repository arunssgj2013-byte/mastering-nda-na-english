/* Topic Wise Practice — Question Tags, Practice Set 1. Supplied questions/answers/explanations preserved. */
(function(){
const D='Directions: Choose the correct question tag to complete each sentence.';
const questions=[
{"n":1,"c":D,"q":"She has completed the assignment, _____?","o":["hasn’t she","doesn’t she","didn’t she","isn’t she"],"a":0,"e":"A positive statement takes a negative tag. The auxiliary has is repeated in the tag."},
{"n":2,"c":D,"q":"Nobody informed you about the change, _____?","o":["didn’t they","did they","did he","didn’t he"],"a":1,"e":"Nobody has a negative meaning, so the tag is positive. They is normally used to refer back to nobody."},
{"n":3,"c":D,"q":"I am expected to attend the meeting, _____?","o":["am I not","aren’t I","isn’t I","don’t I"],"a":1,"e":"The standard negative question tag after I am is aren’t I?"},
{"n":4,"c":D,"q":"Let’s discuss the matter after lunch, _____?","o":["will we","shall we","do we","should we"],"a":1,"e":"A sentence beginning with Let’s normally takes shall we?"},
{"n":5,"c":D,"q":"The cadets did not miss the morning parade, _____?","o":["didn’t they","did they","were they","do they"],"a":1,"e":"A negative statement takes a positive tag. The auxiliary did is retained."},
{"n":6,"c":D,"q":"Everyone enjoyed the programme, _____?","o":["didn’t he","didn’t they","did they","wasn’t it"],"a":1,"e":"Indefinite pronouns such as everyone, everybody, and someone commonly take they in the question tag."},
{"n":7,"c":D,"q":"Open the window, _____?","o":["do you","shall you","will you","don’t you"],"a":2,"e":"An ordinary imperative commonly takes will you? as its question tag."},
{"n":8,"c":D,"q":"There were several mistakes in the report, _____?","o":["weren’t they","weren’t there","were there","didn’t there"],"a":1,"e":"When the statement begins with introductory there, there is repeated in the tag."},
{"n":9,"c":D,"q":"He seldom visits his old friends, _____?","o":["doesn’t he","does he","did he","isn’t he"],"a":1,"e":"Seldom has a negative or near-negative meaning. Therefore, the question tag is positive."},
{"n":10,"c":D,"q":"You can solve this problem, _____?","o":["can you","can’t you","don’t you","won’t you"],"a":1,"e":"A positive statement containing can takes the negative tag can’t you?"},
{"n":11,"c":D,"q":"Nothing can prevent him from trying again, _____?","o":["can it","can’t it","can they","cannot he"],"a":0,"e":"Nothing is negative in meaning, so the tag is positive. It is used to refer back to nothing."},
{"n":12,"c":D,"q":"Let us go out for a while, _____?","o":["shall we","will you","will we","should we"],"a":1,"e":"Let us used as a request for permission is generally followed by will you?, whereas Let’s takes shall we?"},
{"n":13,"c":D,"q":"He used to play football in his school days, _____?","o":["used he","didn’t he","doesn’t he","hadn’t he"],"a":1,"e":"In standard modern usage and competitive-exam grammar, used to commonly takes didn’t + pronoun in the tag."},
{"n":14,"c":D,"q":"Don’t make unnecessary noise, _____?","o":["do you","shall you","will you","won’t you"],"a":2,"e":"A negative imperative commonly takes the positive tag will you?"},
{"n":15,"c":D,"q":"This is not your first attempt, _____?","o":["isn’t this","is this","is it","isn’t it"],"a":2,"e":"This becomes it in a question tag. Since the statement is negative, the tag is positive."},
{"n":16,"c":D,"q":"Few candidates could answer the last question, _____?","o":["couldn’t they","could they","did they","could he"],"a":1,"e":"Few means hardly any and has a negative sense; therefore, the tag is positive."},
{"n":17,"c":D,"q":"A few candidates could answer the last question, _____?","o":["could they","couldn’t they","did they","didn’t they"],"a":1,"e":"A few has a positive meaning—some candidates could answer. Hence, the tag is negative."},
{"n":18,"c":D,"q":"He ought to respect his elders, _____?","o":["ought he","oughtn’t he","shouldn’t he","doesn’t he"],"a":1,"e":"When ought to functions as the auxiliary, the corresponding tag is oughtn’t + pronoun."},
{"n":19,"c":D,"q":"Neither of the two boys was present, _____?","o":["wasn’t he","were they","was he","was they"],"a":1,"e":"Neither is negative in meaning, so a positive tag is required. In modern English, they naturally refers back to neither of the two boys."},
{"n":20,"c":D,"q":"You had better consult a doctor, _____?","o":["hadn’t you","didn’t you","wouldn’t you","shouldn’t you"],"a":0,"e":"With had better, the tag is formed using had: hadn’t you?"},
{"n":21,"c":D,"q":"Those are your books, _____?","o":["aren’t those","aren’t they","are they","isn’t it"],"a":1,"e":"These and those are replaced by they in question tags."},
{"n":22,"c":D,"q":"He never complains about his workload, _____?","o":["doesn’t he","does he","did he","isn’t he"],"a":1,"e":"Never makes the statement negative in meaning, so the tag must be positive."},
{"n":23,"c":D,"q":"You would rather stay at home, _____?","o":["wouldn’t you","hadn’t you","didn’t you","shouldn’t you"],"a":0,"e":"With would rather, the auxiliary would is repeated in the question tag."},
{"n":24,"c":D,"q":"Someone has left the door open, _____?","o":["hasn’t he","haven’t they","has they","didn’t they"],"a":1,"e":"Someone is normally referred to by singular they in the tag; accordingly, has becomes have with they: haven’t they?"},
{"n":25,"c":D,"q":"You have to submit the form today, _____?","o":["haven’t you","don’t you","do you","hadn’t you"],"a":1,"e":"In have to meaning obligation, have is ordinarily a lexical verb in this construction, so the simple-present tag uses do: don’t you?"},
{"n":26,"c":D,"q":"She hardly knows anyone in this city, _____?","o":["doesn’t she","does she","did she","isn’t she"],"a":1,"e":"Hardly has a negative meaning, so it requires a positive question tag."},
{"n":27,"c":D,"q":"The boys have been practising since morning, _____?","o":["haven’t they","aren’t they","don’t they","weren’t they"],"a":0,"e":"In the present perfect continuous, the first auxiliary have is used to form the tag."},
{"n":28,"c":D,"q":"Everything is ready for the inspection, _____?","o":["isn’t everything","isn’t it","is it","aren’t they"],"a":1,"e":"Everything is represented by it in a question tag. The positive statement requires a negative tag."},
{"n":29,"c":D,"q":"He rarely makes such mistakes, _____?","o":["doesn’t he","does he","did he","isn’t he"],"a":1,"e":"Rarely is negative in sense, so a positive tag is required."},
{"n":30,"c":D,"q":"The train had left before we reached the station, _____?","o":["didn’t it","hadn’t it","had it","wasn’t it"],"a":1,"e":"The main clause contains past perfect had left, so the tag uses had: hadn’t it?"},
{"n":31,"c":D,"q":"No one objected to the proposal, _____?","o":["didn’t they","did they","did he","wasn’t it"],"a":1,"e":"No one makes the statement negative, requiring a positive tag. They is commonly used to refer back to no one."},
{"n":32,"c":D,"q":"She need not attend the meeting, _____?","o":["need she","needs she","does she","doesn’t she"],"a":0,"e":"Here need is used as a modal auxiliary (need not), so the tag uses need: need she?"},
{"n":33,"c":D,"q":"He needs to improve his handwriting, _____?","o":["needn’t he","needs he","doesn’t he","isn’t he"],"a":2,"e":"Here need is an ordinary lexical verb (needs to improve), so the question tag is formed with does."},
{"n":34,"c":D,"q":"He dare not challenge the decision, _____?","o":["does he","dare he","doesn’t he","dares he"],"a":1,"e":"Here dare is functioning as a modal auxiliary in the negative construction dare not, so the positive tag is dare he?"},
{"n":35,"c":D,"q":"I think she will qualify for the examination, _____?","o":["don’t I","won’t I","won’t she","will she"],"a":2,"e":"With affirmative expressions such as I think/believe/suppose + clause, the tag normally relates to the subordinate proposition. Here the relevant clause is she will qualify."},
{"n":36,"c":D,"q":"I don’t think he has understood the instructions, _____?","o":["do I","has he","hasn’t he","does he"],"a":1,"e":"With I don’t think..., the negative meaning applies to the subordinate proposition. The tag therefore follows he has understood in positive form: has he?"},
{"n":37,"c":D,"q":"One should keep one’s promises, _____?","o":["shouldn’t one","shouldn’t he","doesn’t one","should one"],"a":0,"e":"When formal one is used as the subject, one is normally retained in the question tag."},
{"n":38,"c":D,"q":"He has a new car, _____?","o":["hasn’t he","doesn’t he","didn’t he","isn’t he"],"a":1,"e":"In standard contemporary usage, when have is a main verb meaning possession, especially in patterns such as He has a car, the do-support tag doesn’t he? is the safest exam answer. (Hasn’t he? occurs in some British usage.)"},
{"n":39,"c":D,"q":"What he told us was true, _____?","o":["wasn’t he","didn’t he","wasn’t it","was it"],"a":2,"e":"When a clause functions as the subject, it is normally represented by it in the question tag. The main verb is was, so the tag is wasn’t it?"},
{"n":40,"c":D,"q":"There is little hope of finding the missing documents, _____?","o":["isn’t there","is there","isn’t it","is it"],"a":1,"e":"Little means hardly any and gives the statement a negative sense, so the tag is positive. Since the sentence uses introductory there, the tag is is there?"}
];
if(typeof TOPIC_PRACTICE_SERIES!=='undefined'&&Array.isArray(TOPIC_PRACTICE_SERIES)){
  TOPIC_PRACTICE_SERIES.push({id:'question-tags-set-1',topic:'Question Tags',setNo:1,label:'Question Tags — Practice Set 1',duration:50,marksPerCorrect:4,negativeMark:1.33,questions});
}
})();
