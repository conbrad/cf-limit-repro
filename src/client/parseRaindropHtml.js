const parsePocketHtml = (html) => {
    const collection = [];
    const domSerializer = (el) => {
      const tempDoc = new Document();
      tempDoc.append(el);
      const matches = tempDoc.querySelectorAll("a");
      matches.forEach((match) => {
        const href = match.attributes.getNamedItem("href")?.nodeValue;
        collection.push(href);
      });
      return el;
    };
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html")
    const readability = new Readability(doc, {serializer: domSerializer})
    readability.parse()
    return collection;
  };
  