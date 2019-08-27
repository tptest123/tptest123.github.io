
var storyData;
var stats;
var startStats;
var nodes;
var choices;
var theme;

var currentNode;

var nodeScreen;
var choicesDiv;
var nodeHeader;
var mainText;

function preload(){
    storyData = JSON.parse(`{"nodes":[{"name":"Training ground","text":"This is a place to train and prepare for the Outdoors","choices":[{"text":"train and gain strength","destination":{"label":"Training ground","value":0},"requirements":[],"showingRequirements":false,"results":[{"stat":{"label":"strength","value":"strength","val":"5","type":"Number"},"op":"+","val":1}],"showingResults":true},{"text":"go hunt monsters","destination":{"label":"The Outdoors","value":1},"requirements":[{"stat":{"label":"strength","value":"strength","val":"5","type":"Number"},"op":">","val":"8"}],"showingRequirements":true,"results":[],"showingResults":false}]},{"name":"The Outdoors","text":"You made it. Nice","choices":[],"bgimage":null}],"stats":[{"label":"strength","value":"strength","val":"5","type":"Number"}],"theme":{"bg":"#ffffff","choicebg":"#0000ff30","choicestyle":"square","choicefont":"#000000","fontcol":"#000000","headercol":"#000000","txtbg":"#00000000"}}`);
    print(storyData);
}

function setup() {
    nodes = storyData.nodes;
    stats = storyData.stats;
    for (var i = 0; i < stats.length; i++){
        if (stats[i].type == 'Number') stats[i].val = int(stats[i].val);
        else if (stats[i].type == 'List') {
            stats[i].val = stats[i].val.split(',').map(str => str.trim());
        }
    }
    startStats = JSON.parse(JSON.stringify(stats));
    theme = storyData.theme;
    setupUI();
}


function getStatIndex(statname){
    for (var i = 0; i < stats.length; i++){
        if (stats[i].label == statname) return i;
    }
    return -1;
}
function getStatType(statname){
    for (var i = 0; i < stats.length; i++){
        if (stats[i].label == statname) return stats[i].type;
    }
}
function getStatVal(statname){
    for (var i = 0; i < stats.length; i++){
        if (stats[i].label == statname) return stats[i].val;
    }
}

function checkRequirements(req){
    var stat = req.stat;
    var op = req.op;
    var value = req.val;
    var statval = getStatVal(stat.label);
    if (stat.type == 'Number'){
        if ((op == '>' || op == '>=') && statval > int(value)) return true;
        if ((op == '<' || op == '<=') && statval < int(value)) return true;
        if (op == '=' && statval == int(value)) return true;
        print("Failed at "+req);
        return false;
    }
    else if (stat.type == 'True/False'){
        if (op == '=' && statval == boolean(value)) return true;
        if (op == '!=' && val != boolean(value)) return true;
        print("Failed at "+req);
        return false;
    }
    else if (stat.type == 'Text'){
        if (op == '=' && statval == value) return true;
        print("Failed at "+req);
        return false;
    }
    else if (stat.type == 'List'){
        if (op == 'has' && statval.indexOf(value) > -1) return true;
        if (op == '!has' && statval.indexOf(value) == -1) return true;
        print("Failed at "+req);
        return false;
    }
    else {
        print("nope req");
    }
}

function checkValidNode(nodename){
    for (var i = 0; i < nodes.length; i++){
        if (nodes[i].name == nodename) return true;
    }
    return false;
}

function getNodeIndex(nodename){
    for (var i = 0; i < nodes.length; i++){
        if (nodes[i].name == nodename) return i;
    }
    return 0;
}

function applyResults(results){
    print('applying results');
    for (var i = 0; i < results.length; i++){
        var res = results[i];
        print(res);
        var stat = res.stat;
        var op = res.op;

        var val = res.val;

        var ind = getStatIndex(stat.label);
        print(ind);
        if (ind == -1) continue;
        if (stat.type == 'Number') {
            val = int(val);
            if (val[0]) val = val[0];
            if (op == '+') stats[ind].val += val;
            if (op == '-') stats[ind].val -= val;
            if (op == '=') stats[ind].val = val;
        }
        else if (stat.type == 'True/False'){
            if (op == '=') stats[ind].val = boolean(val);
        }
        else if (stat.type == 'Text'){
            if (op == '=') stats[ind].val = val;
        }
        else if (stat.type == 'List'){
            if (op == 'gets') stats[ind].val.push(val);
            if (op == 'loses') {
                var indexToRemove = stats[ind].val.indexOf(val);
                if (indexToRemove > -1) {
                    stats[ind].val.splice(indexToRemove, 1);
                }
            }
        }
        else {
            print("nope res");
        }
    }
}

function setupChoices(){
    try {
        choicesDiv.html('');
        choicesDiv.remove();
    }
    catch (e) {}
    choicesDiv = createDiv();
    choicesDiv.id('choicesdiv');
    nodeScreen.child(choicesDiv);
    var divcount = 0;
    for (var ch = 0; ch < nodes[currentNode].choices.length; ch++){
        var valid = true;
        var dest = nodes[currentNode].choices[ch].destination;
        for (var req = 0; req < nodes[currentNode].choices[ch].requirements.length; req++){
            if (!checkRequirements(nodes[currentNode].choices[ch].requirements[req])) valid = false;
        }
        if (!valid) continue;

        var div = createDiv();
        div.class('choice ' + theme.choicestyle);
        div.style('background',theme.choicebg);
        div.style('color',theme.fontcol);
        var choicetext = createElement('h4',nodes[currentNode].choices[ch].text);
        // choicetext.class('choicetext');
        div.child(choicetext);
        const i2 = dest.value;
        const results = nodes[currentNode].choices[ch].results;

        div.mousePressed( () => {
            print(i2);
            applyResults(results);
            changeNode(i2);
        });
        choicesDiv.child(div);
        divcount++;
    }
    if (divcount == 0){
        // the reader has no choices available, adding a reset game choice
        var div = createDiv();
        div.class('choice');
        div.style('background',theme.choicebg);
        div.style('color',theme.fontcol);
        var choicetext = createElement('h4',"Restart from the beginning");
        // choicetext.class('choicetext');
        choicesDiv.child(div);
        div.child(choicetext);
        div.mousePressed( () => {
            stats = JSON.parse(JSON.stringify(startStats));
            changeNode(0);
        });
    }
}

function changeNode(i){
    // CHANGE mainText.value(nodes[i].text);
    mainText.value(stats.join(','));
    nodeHeader.html(nodes[i].name);
    currentNode = i;
    setupChoices();
    /* var div = document.querySelector('.nodescreen');
    div.classList.add('hiddennode');
    setTimeout(r => {
        if (nodes[i].bgimage) {
            var s = 'url(img/node' + i + 'bg.png';
            document.body.style.background = s;
        } else document.body.style.background = theme.bg;
        mainText.value(nodes[i].text);
        nodeHeader.html(nodes[i].name);
        currentNode = i;
        setupChoices();
        print(stats);
        print(storyData);
        div.classList.remove('hiddennode');
    }, 301) */
}

function setupUI(){
    if (nodes[0].bgimage) {
        document.body.style.background = "url('img/node0bg.png')";
    } else document.body.style.background = theme.bg;
    nodeScreen = select('.nodescreen');
    nodeHeader = select('.nodeheader');
    nodeHeader.style('color',theme.headercol);
    mainText = select('.maintextarea');
    mainText.style('color',theme.fontcol);
    mainText.style('background',theme.txtbg);
    choicesDiv = select('#choicesdiv');
    // changeNode(0); --- instead repeat the code without fade
    var div = document.querySelector('.nodescreen');
    // CHANGE mainText.value(nodes[0].text);
    mainText.value(stats.join(','));
    nodeHeader.html(nodes[0].name);
    currentNode = 0;
    setupChoices();
    print(stats);
    print(storyData);
}
    