require('dotenv').config();

const  _ = require('lodash')
    , Async = require('async')
    , OS = require('os')
    , Delay = require('delay')
    , Path = require('path')
    , FS = require('fs')
    , FSE = require('fs-extra')
    , Util = require('util')
    , Moment = require('moment')
    , CP = require('child_process')
    , Words = FS.readFileSync(require('word-list')).toString().split('\n')
    , Optionator = require('optionator')({
        options: [
          {
            option: 'outpath'
          , type: 'String'
          , required: true
          }
        , {
            option: 'minlength'
          , type: 'Number'
          , required: true
          , default: '3'
          }
        , {
            option: 'allshift'
          , type: 'Boolean'
          }
        ]
      })
;

var OPTS
  , SCRIPT = Path.basename(__filename);

try {
  OPTS = Optionator.parseArgv(process.argv);
} catch (err) {
  console.log(Optionator.generateHelp());
  process.exit();
}

(async function Main(){
  let masks = {};
  
  Words.map(word => {
    if (word.length < OPTS.minlength) return;
    
    let consonant_mask = word.replace(/(a|e|i|o|u)/g, '_');
    if (!consonant_mask.match(/\_/)) return;
    
    let vowel_mask = word.replace(/[^aeiou]/g, '');
    
    masks[consonant_mask] = masks[consonant_mask] || {
      consonant_mask
    , word_length: word.length
    , vowel_count: vowel_mask.length
    , words: []
    };
    
    masks[consonant_mask].words.push({
      word
    , vowel_mask 
    });
  });
  
  let solutions = _.pickBy(masks, mask => {
    if (mask.words.length !== 5) return false;
    
    let solution = true
      , index = 0;
      
    while (solution && index < mask.vowel_count) {
      let vowels = _.uniq(_.map(mask.words, word => word.vowel_mask[index]));
      index++;
      
      if (vowels.length === 5) continue;
      
      if (vowels.length !== 1 || OPTS.allshift) {
        solution = false;
        break;
      }
    }
    
    if (solution) return true;
  });
  
  let csv = `consonant_mask,word_length,vowel_count,word_1,word_2,word_3,word_4,word_5\n`;
  csv += _.map(solutions, mask => {
    return `${mask.consonant_mask},${mask.words.length},${mask.vowel_count},`
          + _.map(mask.words, 'word').join(',');
  }).join('\n');
  
  FS.writeFileSync(OPTS.outpath, csv);
})();
