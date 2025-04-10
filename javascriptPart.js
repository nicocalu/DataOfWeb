var districts = [];
var onClickListenerDistricts = [];
var alreadyRan = false;
function addEventListenerOnDistricts(searchedText) {
  var lyon = document.getElementById("lyon_districts");
  districts = lyon.getElementsByTagName("path");
  if(alreadyRan == false) {
    lyon.addEventListener('mouseleave', ()=>
        replaceMouseInfo("mouse leave lyon"));
  }
  var i = 0;
  for (const d of districts) {
    d.removeEventListener('click', onClickListenerDistricts[i], true);
    onClickListenerDistricts[i] = ()=>handleClickDistrict(searchedText, d, districts);

    d.addEventListener("click",onClickListenerDistricts[i]);

    if (alreadyRan == false) {
      d.addEventListener("mouseover", () =>
        replaceMouseInfo("mouse over " + d.id),
      );
    }
    i++;
  }
  alreadyRan = true;
}
function replaceMouseInfo(txt) {
  document.getElementById("id_mouse_info").innerText = txt;
}

function handleClickDistrict(searchedText, district, allDistricts){
  for(const a of allDistricts){
    a.style.fill = "beige";}
  district.style.fill = "lightgreen";

  displayLyonDistrictInfo(searchedText, district);

}
function displayLyonDistrictInfo(searchedText, district){
  var span = document.getElementById('lyon-info');

  // Load the XSL file using a synchronous XMLHttpRequest
  var xslDocument = loadHTTPXML('./districtInfo.xsl');

  // Create an XSL processor
  var xsltProcessor = new XSLTProcessor();

  // Import the .xsl file
  xsltProcessor.importStylesheet(xslDocument);

  // Pass the parameter to the stylesheet
  xsltProcessor.setParameter("", "district_param", district.id);
  xsltProcessor.setParameter("", "search_param", searchedText);

  // Load the XML file using a synchronous XMLHttpRequest
  var xmlDocument = loadHTTPXML('../velov.xml');

  // Create the XML document transformed by XSL
  var newXmlDocument = xsltProcessor.transformToDocument(xmlDocument);

  // Find the parent (whose ID is "here") of the element to be replaced in the current HTML document
  var elementHtmlParent = window.document.getElementById(
    "lyon-info",
  );

  // Insert the transformed element into the HTML page
  elementHtmlParent.innerHTML = newXmlDocument.children[0].innerHTML;

  
   
}
function loadLyonDistricts(svgPath) {
  var svg = loadHTTPXML(svgPath);
  const s = new XMLSerializer();
  const svgStr = s.serializeToString(svg);

  const svgDOM = document.getElementById("svg_districts");
  svgDOM.innerHTML = svgStr;
}
function loadHTTPXML(xmlDocumentUrl) {
  var httpAjax;

  httpAjax = window.XMLHttpRequest
    ? new XMLHttpRequest()
    : new ActiveXObject("Microsoft.XMLHTTP");

  if (httpAjax.overrideMimeType) {
    httpAjax.overrideMimeType("text/xml");
  }

  // Load the XML file using a synchronous XMLHttpRequest (the 3rd parameter is set to false)
  httpAjax.open("GET", xmlDocumentUrl, false);
  httpAjax.send();

  return httpAjax.responseXML;
}

function btn5InsertResultTable(xmlPath, xslPath) {
  xmlPath = "../velov.xml";
  xslPath = "./communes2.xsl";
  var xslDocument = loadHTTPXML(xslPath);

  var xsltProcessor = new XSLTProcessor();

  xsltProcessor.importStylesheet(xslDocument);

  var xmlDocument = loadHTTPXML(xmlPath);

  var newXmlDocument = xsltProcessor.transformToDocument(xmlDocument);

  var elementHtmlParent = window.document.getElementById("id_table_to_replace");

  elementHtmlParent.innerHTML = newXmlDocument.children[0].innerHTML;
}

function changeBgColor(bgColor, color) {
  var btn1 = window.document.getElementById("btn1");
  btn1.style.color = color;
  document.body.style.backgroundColor = bgColor;
}

function displayNameAndCommune(xmlPath) {
  var spanToReplace = document.getElementById(
    "id_names_and_communes_to_replace",
  );
  var xmlFile = loadHTTPXML(xmlPath);
  const d = new DOMParser();
  const xmlDOM = d.parseFromString(xmlFile, "text/xml");

  var xpathRes = xmlDOM.evaluate(
    "//velovstation[bonus='true']/name",
    xmlDOM,
    null,
    XPathResult.FIRST_ORDERED_NODE_TYPE,
    null,
  );
  console.log(xpathRes);
  spanToReplace.innerHTML = xpathRes[0];
}
