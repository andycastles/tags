import { extend, override } from 'flarum/extend';
import IndexPage from 'flarum/components/IndexPage';
import DiscussionList from 'flarum/components/DiscussionList';

import TagHero from './components/TagHero';

export default function() {
  IndexPage.prototype.currentTag = function() {
    const slug = this.params().tags;

    if (slug) return app.store.getBy('tags', 'slug', slug);
  };

  // If currently viewing a tag, insert a tag hero at the top of the view.
  override(IndexPage.prototype, 'hero', function(original) {
    const tag = this.currentTag();

    if (tag) return TagHero.component({tag});

    return original();
  });

  extend(IndexPage.prototype, 'view', function(vdom) {
    const tag = this.currentTag();

    if (tag) vdom.attrs.className += ' IndexPage--tag'+tag.id();
  });

  extend(IndexPage.prototype, 'config', function() {
    const tag = this.currentTag();

    if (tag) {
      app.setTitle(tag.name());
    }
  });

  // If currently viewing a tag, restyle the 'new discussion' button to use
  // the tag's color, and disable if the user isn't allowed to edit.
  extend(IndexPage.prototype, 'sidebarItems', function(items) {
    const tag = this.currentTag();

    if (tag) {
      const color = tag.color();
      const canStartDiscussion = tag.canStartDiscussion();

      if (color) {
        items.get('newDiscussion').props.style = {backgroundColor: color};
      }
    
      items.get('newDiscussion').props.disabled = !canStartDiscussion;
      items.get('newDiscussion').props.children = app.translator.trans(canStartDiscussion ? 'core.forum.index.start_discussion_button' : 'core.forum.index.cannot_start_discussion_button');
    
    }
  });

  // Add a parameter for the IndexPage to pass on to the DiscussionList that
  // will let us filter discussions by tag.
  extend(IndexPage.prototype, 'params', function(params) {
    params.tags = m.route.param('tags');
  });

  // Translate that parameter into a gambit appended to the search query.
  extend(DiscussionList.prototype, 'requestParams', function(params) {
    params.include.push('tags');

    if (this.props.params.tags) {
      params.filter.q = (params.filter.q || '') + ' tag:' + this.props.params.tags;
    }
  });
}
