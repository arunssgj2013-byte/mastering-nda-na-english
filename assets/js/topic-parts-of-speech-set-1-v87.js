/* Topic Wise Practice — Parts of Speech, Practice Set 1. Supplied questions/answers/explanations preserved. */
(function(){
const C='Directions: In each of the following sentences, identify the part of speech of the word written in CAPITAL LETTERS.';
const questions=[
{n:1,c:C,q:'The soldiers marched FORWARD despite the heavy rain.',o:['Adjective','Adverb','Preposition','Conjunction'],a:1,e:'Forward modifies the verb marched by indicating the direction of the action; hence, it is an adverb.'},
{n:2,c:C,q:'We reached the station BEFORE the train arrived.',o:['Preposition','Adverb','Conjunction','Adjective'],a:2,e:'Before joins the main clause with the subordinate clause the train arrived. Therefore, it functions as a conjunction.'},
{n:3,c:C,q:'She has ENOUGH patience to deal with difficult situations.',o:['Adjective','Adverb','Pronoun','Conjunction'],a:0,e:'Enough qualifies the noun patience and therefore functions as an adjective.'},
{n:4,c:C,q:'ALAS! We could not save the injured animal.',o:['Adverb','Conjunction','Interjection','Adjective'],a:2,e:'Alas! expresses a sudden feeling of sorrow and is therefore an interjection.'},
{n:5,c:C,q:'He has not visited us SINCE Monday.',o:['Conjunction','Preposition','Adverb','Adjective'],a:1,e:'Since is followed by the noun Monday, which is its object. Therefore, it functions as a preposition.'},
{n:6,c:C,q:'The POOR deserve our sympathy and support.',o:['Noun','Pronoun','Adjective used substantively','Adverb'],a:2,e:'Poor is originally an adjective, but the poor collectively means poor people. It is an adjective used substantively.'},
{n:7,c:C,q:'He works HARD to achieve his goals.',o:['Adjective','Adverb','Noun','Preposition'],a:1,e:'Hard modifies the verb works and tells us how he works.'},
{n:8,c:C,q:'I know THAT he is capable of doing the job.',o:['Pronoun','Adjective','Conjunction','Preposition'],a:2,e:'That introduces the subordinate noun clause he is capable of doing the job and functions as a conjunction.'},
{n:9,c:C,q:'The committee discussed the ABOVE proposal in detail.',o:['Adverb','Preposition','Adjective','Pronoun'],a:2,e:'Above qualifies the noun proposal and therefore functions as an adjective.'},
{n:10,c:C,q:'He remained calm THROUGHOUT the interview.',o:['Adverb','Preposition','Conjunction','Adjective'],a:1,e:'Throughout takes the interview as its object and therefore functions as a preposition.'},
{n:11,c:C,q:'She sings remarkably WELL.',o:['Adjective','Noun','Adverb','Conjunction'],a:2,e:'Well modifies the verb sings and tells us how she sings.'},
{n:12,c:C,q:'WHAT he said surprised everyone.',o:['Interrogative adjective','Relative pronoun','Conjunction','Adverb'],a:1,e:'What means that which and introduces a nominal relative clause. It also performs a grammatical function within that clause.'},
{n:13,c:C,q:'We went for a walk AFTER dinner.',o:['Conjunction','Adverb','Preposition','Adjective'],a:2,e:'After is followed by the noun dinner, which serves as its object.'},
{n:14,c:C,q:'The train is moving very FAST.',o:['Adjective','Adverb','Noun','Preposition'],a:1,e:'Fast modifies the verb is moving, so it functions as an adverb.'},
{n:15,c:C,q:'EITHER answer is acceptable.',o:['Pronoun','Conjunction','Distributive adjective/Determiner','Adverb'],a:2,e:'Either directly modifies the noun answer, meaning either one of the two.'},
{n:16,c:C,q:'He tried hard, BUT he could not solve the problem.',o:['Preposition','Adverb','Conjunction','Pronoun'],a:2,e:'But joins two coordinate clauses and expresses contrast.'},
{n:17,c:C,q:'There is LITTLE hope of his recovery.',o:['Adverb','Adjective','Pronoun','Conjunction'],a:1,e:'Little qualifies the uncountable noun hope and indicates a small quantity.'},
{n:18,c:C,q:'The children ran ROUND the playground.',o:['Adjective','Adverb','Preposition','Conjunction'],a:2,e:'Round is followed by its object the playground and shows the relationship between ran and playground.'},
{n:19,c:C,q:'SOME have already submitted their applications.',o:['Adjective','Pronoun','Adverb','Conjunction'],a:1,e:'Some stands independently in place of a noun, meaning some people/candidates, so it functions as a pronoun.'},
{n:20,c:C,q:'He arrived LATE for the interview.',o:['Adjective','Adverb','Preposition','Noun'],a:1,e:'Late modifies the verb arrived and indicates when he arrived.'},
{n:21,c:C,q:'I have known him SINCE he joined the school.',o:['Preposition','Adverb','Conjunction','Adjective'],a:2,e:'Here since introduces the clause he joined the school. Therefore, it functions as a conjunction.'},
{n:22,c:C,q:'THIS is the book I was looking for.',o:['Adjective','Demonstrative pronoun','Relative pronoun','Adverb'],a:1,e:'This stands independently instead of qualifying a following noun, so it is a demonstrative pronoun.'},
{n:23,c:C,q:'She is MUCH wiser than her sister.',o:['Adjective','Pronoun','Adverb','Preposition'],a:2,e:'Much modifies the comparative adjective wiser, so it functions as an adverb.'},
{n:24,c:C,q:'The man WHO helped us was a stranger.',o:['Interrogative pronoun','Relative pronoun','Conjunction','Demonstrative pronoun'],a:1,e:'Who refers back to the man and introduces the relative clause who helped us.'},
{n:25,c:C,q:'We had met him BEFORE.',o:['Preposition','Conjunction','Adverb','Adjective'],a:2,e:'Before has no object and independently modifies had met, indicating time.'},
{n:26,c:C,q:'He is BUT a child.',o:['Conjunction','Preposition','Adverb','Pronoun'],a:2,e:'Here but means only/merely and modifies the expression a child. Therefore, it functions as an adverb.'},
{n:27,c:C,q:'He went DOWN the stairs quickly.',o:['Adverb','Preposition','Adjective','Conjunction'],a:1,e:'Down is followed by the object the stairs and expresses direction in relation to it.'},
{n:28,c:C,q:'She bought a ROUND table for the dining room.',o:['Adverb','Preposition','Adjective','Noun'],a:2,e:'Round describes the shape of the noun table and therefore functions as an adjective.'},
{n:29,c:C,q:'He is STILL waiting for the results.',o:['Adjective','Adverb','Conjunction','Preposition'],a:1,e:'Still modifies is waiting and means even now/up to this time.'},
{n:30,c:C,q:'The AFTER effects of the storm were devastating.',o:['Preposition','Conjunction','Adjective','Adverb'],a:2,e:'Here after qualifies effects and means subsequent or following; therefore, it functions adjectivally.'},
{n:31,c:C,q:'He has MORE experience than his younger colleague.',o:['Pronoun','Adverb','Adjective','Conjunction'],a:2,e:'More modifies the noun experience and indicates quantity.'},
{n:32,c:C,q:'He succeeded BECAUSE he worked consistently.',o:['Preposition','Conjunction','Adverb','Pronoun'],a:1,e:'Because introduces the subordinate clause giving the reason for his success.'},
{n:33,c:C,q:'The situation is BEYOND our control.',o:['Adverb','Conjunction','Preposition','Adjective'],a:2,e:'Beyond takes our control as its object and shows a relationship between the situation and control.'},
{n:34,c:C,q:'He is strong ENOUGH to lift the box.',o:['Adjective','Adverb','Pronoun','Preposition'],a:1,e:'Here enough modifies the adjective strong, so it functions as an adverb.'},
{n:35,c:C,q:'WHICH route should we take?',o:['Relative pronoun','Interrogative adjective/Determiner','Interrogative pronoun','Conjunction'],a:1,e:'Which modifies the noun route while asking a question, so it functions as an interrogative adjective/determiner.'},
{n:36,c:C,q:'All BUT Rohan attended the meeting.',o:['Conjunction','Adverb','Preposition','Adjective'],a:2,e:'Here but means except and is followed by the noun Rohan. Therefore, it functions as a preposition.'},
{n:37,c:C,q:'She looked UP when her name was announced.',o:['Preposition','Adjective','Adverb','Conjunction'],a:2,e:'Up has no object here and modifies looked by indicating direction, so it functions as an adverb.'},
{n:38,c:C,q:'The VERY thought of failure frightened him.',o:['Adverb','Adjective','Pronoun','Conjunction'],a:1,e:'Here very means exact/same and qualifies the noun thought. It is therefore an adjective, not an adverb.'},
{n:39,c:C,q:'I know the reason WHY he resigned.',o:['Relative adverb','Relative pronoun','Conjunction','Adjective'],a:0,e:'Why refers back to reason and introduces the relative clause why he resigned. It functions as a relative adverb.'},
{n:40,c:C,q:'TO forgive is sometimes more difficult than to punish.',o:['Preposition','Adverb','Infinitive marker','Conjunction'],a:2,e:'Here to precedes the base verb forgive and marks the infinitive to forgive. It is not functioning as a preposition.'}
];
if(typeof TOPIC_PRACTICE_SERIES!=='undefined'&&Array.isArray(TOPIC_PRACTICE_SERIES)){
 TOPIC_PRACTICE_SERIES.push({id:'parts-of-speech-set-1',topic:'Parts of Speech',setNo:1,label:'Parts of Speech — Practice Set 1',duration:50,marksPerCorrect:4,negativeMark:1.33,questions});
}
})();
