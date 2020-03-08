let str = 
  `<html>
    <body>
      <div id="app">
        <span>1</span>
        <div my-data=12>
        </div>
      </div>
    </body>
  </html>`;

const tagStartOpen = /^\s*<([a-zA-Z_][\w]*)/;
const tagStartClose = /^\s*(\/?)>/;
const tagEnd = /^\s*<\/[a-zA-Z_][^>]*>/;
const attribute = /^\s*([^\s"'<>\/=]+)(?:\s*(=)\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]*)))/;

const TAG_TYPE = 0;
const TEXT_TYPE = 1;

let generateElement = (tag) => {
  let { type, tagName = null, attrs } = tag;
  let attrMap = {};
  for(let i = 0; i < attrs.length; i++) {
    let match = attrs[i];
    let name = match[1];
    let value = match[3] || match[4] || match[5] || '';
    attrMap[name] = value;
  }
  return {
    type,
    tagName,
    attrs: attrMap
  }
}

let parseHTML = (html) => {
  let index = 0;
  let last;
  let astRoot;
  let stack = [];
  let currentParent;
  const advance = (len) => {
    index += len;
    html = html.slice(len);
  };
  const parseStartTag = () => {
    const start = html.match(tagStartOpen);
    if(!start) return;
    let curTag = {};
    curTag.type = TAG_TYPE;
    curTag.tagName = start[1];
    curTag.attrs = [];
    advance(start[0].length);
    let end, attr;
    // 没遇到开始标签的>结束符，还可以拿到属性
    while(!(end = html.match(tagStartClose)) && (attr = html.match(attribute))) {
      advance(attr[0].length);
      curTag.attrs.push(attr);
    }
    advance(end[0].length);
    return curTag;
  };

  const handleStartTag = (startTag) => {
    let element = generateElement(startTag);
    stack.push(element);
    if(!astRoot) {
      astRoot = element;
      currentParent = astRoot;
      return;
    }
    // 确定父子关系
    // element.parent = currentParent;
    let children = (currentParent.children || (currentParent.children = []));
    children.push(element);
    // 更新 currentParent
    currentParent = element;
  };

  const parseEndTag = () => {
    let match = html.match(tagEnd);
    if(match) {
      advance(match[0].length);
    }
    return match;
  };

  const handleEndTag = (endTag) => {
    stack.length --;
    currentParent = stack[stack.length - 1];    
  };

  const handleText = (text) => {
    let children = (currentParent.children || (currentParent.children = []));
    children.push({
      type: TEXT_TYPE,
      text
    });
    advance(text.length);
  }

  while(html) {
    // 先尝试匹配开始标签
    const startTag = parseStartTag();
    if(startTag) {
      // 匹配到之后，开始建树操作
      handleStartTag(startTag);
      continue;
    }

    const endTag = parseEndTag();
    if(endTag) {
      // 匹配到结束标签
      handleEndTag();
      advance(endTag[0].length);
      continue;
    }

    let textEnd = html.indexOf('<');
    if(textEnd === 0) continue;
    let text;
    // 现在的情况就是匹配文本了
    if(textEnd >= 0) {
      text = html.substring(0, textEnd);
    } else {
      text = html;
      html = '';
    }
    handleText(text);
  }
  console.log(astRoot)
  return astRoot;
}



parseHTML(str);