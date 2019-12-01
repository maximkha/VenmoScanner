//https://stackoverflow.com/questions/469357/html-text-input-allows-only-numeric-input
function setInputFilter(textbox, inputFilter) {
    ["input", "keydown", "keyup", "mousedown", "mouseup", "select", "contextmenu", "drop"].forEach(function (event) {
        textbox.addEventListener(event, function () {
            if (inputFilter(this.value)) {
                this.oldValue = this.value;
                this.oldSelectionStart = this.selectionStart;
                this.oldSelectionEnd = this.selectionEnd;
            } else if (this.hasOwnProperty("oldValue")) {
                this.value = this.oldValue;
                this.setSelectionRange(this.oldSelectionStart, this.oldSelectionEnd);
            }
        });
    });
}

document.onload = function()
{
    setInputFilter(document.getElementById("depthText"), function (value) { return /^-?\d*$/.test(value); });
    container = document.getElementById('mynetwork');
};

//API
var nameID = {};
var explored = [];
var nextID = 0;

//chart data
var nodes = [];
var edges = [];

var data = {
    nodes: [],
    edges: []
};

var container;
var options = {
    nodes: {
        shape: 'dot'
    }
};
var network;

function exportNet()
{
    var pageData = {};
    var maxDepth = parseInt(document.getElementById("depthText").value);
    var initUser = document.getElementById("initial").value;
    pageData.maxDepth = maxDepth;
    pageData.initUser = initUser;
    pageData.netData = data;
    pageData.nameID = nameID;
    document.getElementById("io").value = JSON.stringify(pageData);
}

function start()
{
    data = {
        nodes: [],
        edges: []
    };

    var io = document.getElementById("io").value;
    if (io.length != 0) 
    {
        var pageData = JSON.parse(io);
        document.getElementById("depthText").value = pageData.maxDepth;
        document.getElementById("initial").value = pageData.initUser;
        data = pageData.netData;
        nameID = pageData.nameID;
    }
    container = document.getElementById('mynetwork');
    network = new vis.Network(container, data, options);
    network.on('click', handleClick);
    if (io.length != 0) return;

    var maxDepth = parseInt(document.getElementById("depthText").value);
    var initUser = document.getElementById("initial").value;
    pushVenmoUser(initUser, 0, maxDepth);
}

function pushVenmoUser(userPage, depth, maxDepth)
{
    if (depth >= maxDepth) return;
    if (explored.includes(userPage)) return;
    explored.push(userPage);
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function (){processUser(depth, maxDepth, xhttp);};
    xhttp.open("GET", "venmo.php?user=" + userPage);
    xhttp.send();
}

function processUser(depth, maxDepth, xhttp)
{
    if (xhttp.readyState == 4 && xhttp.status == 200) {
        //console.log(xhttp.responseText);
        var userdata = JSON.parse(xhttp.responseText);
        var rootNode = getIDfromName(userdata.url, userdata.displayName);
        var transactions = userdata.transactions;
        var toExplore = [];
        for (var i = 0; i<transactions.length; i++)
        {
            var tid = getIDfromName(transactions[i].url, transactions[i].displayName);
            if (!toExplore.includes(transactions[i].url)) toExplore.push(transactions[i].url);
            addEdge(rootNode, tid);
        }
        network.setData(data);
        console.log(toExplore);
        for (var i = 0; i<toExplore.length; i++)
        {
            pushVenmoUser(toExplore[i], depth+1, maxDepth);
        }
    }
}

function handleClick(properties)
{
    //just open the first one clicked
    var id = properties.nodes[0];
    if (!id) return;
    var url = "https://venmo.com/" + getUrlFromID(id);
    window.open(url);
}

function getUrlFromID(id)
{
    for (var name in nameID) {
        if (nameID[name] == id) return name;
    }
    return false;
}

function getIDfromName(name, label)
{
    var id = nameID[name];
    if (nameID[name] == undefined) {
        data.nodes.push({
            id: nextID,
            label: label
        });
        nameID[name] = nextID;
        id = nextID;
        nextID++;
    }
    return id;
}

function addEdge(from, to)
{
    var exists = false;
    var existIndex = -1;
    var existValue = undefined;
    for (var i = 0; i < data.edges.length; i++)
    {
        if (data.edges[i].from == from && data.edges[i].to == to)
        {
            exists = true;
            existIndex = i;
            existValue = data.edges[i].value;
            break;
        }
    }
    if (!exists)
    {
        data.edges.push({
            from: from,
            to: to,
            value: 1
        })
    }
    else
    {
        data.edges.splice(existIndex, 1);
        data.edges.push({
            from: from,
            to: to,
            value: existValue + 1
        });
    }
}