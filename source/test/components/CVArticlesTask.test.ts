import { expect } from "chai";

import CVArticlesTask from "client/components/CVArticlesTask";
import CVMeta from "client/components/CVMeta";
import CVNodeProvider from "client/components/CVNodeProvider";
import NVNode from "client/nodes/NVNode";

import { activateTask, createDocumentData, createStory, IStory } from "../helpers/story";


function article(id: string, title: string)
{
    return { id, uris: { EN: `articles/${id}.html` }, titles: { EN: title } };
}

describe("CVArticlesTask", function(){
  let story: IStory;
  let task: CVArticlesTask;
  let sceneMeta: CVMeta;
  let modelMeta: CVMeta;

  const ids = (meta: CVMeta) => meta.articles.items.map(article => article.id);

  beforeEach(function(){
    story = createStory(createDocumentData([
      { name: "Model A", meta: 0 },
      { name: "Model B" },
    ], [
      { articles: [ article("artA", "Model article") ] },
      { articles: [ article("art1", "Scene article 1"), article("art2", "Scene article 2") ] },
    ], 1));

    sceneMeta = story.document.root.meta;
    modelMeta = story.document.innerComponents.getArray(CVMeta).find(meta => meta.node.name === "Model A");

    task = activateTask(story, CVArticlesTask);
  });

  function selectArticle(id: string)
  {
    story.document.setup.reader.ins.articleId.setValue(id);
    story.update();
  }

  it("lists the articles of all nodes, without an active node", function(){
    expect(story.system.getMainComponent(CVNodeProvider).activeNode).to.equal(null);
    expect(task.articles.map(article => article.id)).to.have.members([ "art1", "art2", "artA" ]);
  });

  it("edits an article attached to a model", function(){
    selectArticle("artA");

    expect(task.activeArticle.id).to.equal("artA");
    expect(task.ins.title.value).to.equal("Model article");
  });

  describe("create", function(){
    it("attaches new articles to the scene", function(){
      task.ins.create.set();
      story.update();

      expect(sceneMeta.articles.length).to.equal(3);
      expect(ids(modelMeta)).to.deep.equal([ "artA" ]);
      expect(story.document.setup.reader.outs.count.value).to.equal(4);
    });

    it("attaches new articles to the scene while a model is active", function(){
      story.system.getMainComponent(CVNodeProvider).activeNode = modelMeta.node as NVNode;

      task.ins.create.set();
      story.update();

      expect(sceneMeta.articles.length).to.equal(3);
      expect(ids(modelMeta)).to.deep.equal([ "artA" ]);
    });

    it("saves new articles with the scene of a document without scene meta", function(){
      story = createStory(createDocumentData([{ name: "Model A" }]));
      task = activateTask(story, CVArticlesTask);

      task.ins.create.set();
      story.update();

      expect(story.document.root.meta.articles.length).to.equal(1);
      expect(story.document.deflateDocument().metas[0].articles).to.have.length(1);
    });
  });

  it("deletes an article from its node", function(){
    selectArticle("artA");

    task.ins.delete.set();
    story.update();

    expect(ids(modelMeta)).to.deep.equal([]);
    expect(ids(sceneMeta)).to.deep.equal([ "art1", "art2" ]);
  });

  it("reorders an article within its node", function(){
    selectArticle("art2");

    task.ins.moveArticleUp.set();
    story.update();

    expect(ids(sceneMeta)).to.deep.equal([ "art2", "art1" ]);
    expect(ids(modelMeta)).to.deep.equal([ "artA" ]);
  });
});
