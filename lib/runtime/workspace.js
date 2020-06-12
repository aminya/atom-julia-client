'use babel'
import { CompositeDisposable } from 'atom';
import { client } from '../connection';
import { views } from '../ui';
import goto from './goto';
import modules from './modules';

const { workspace, gotosymbol: gotoSymbol, clearLazy } = client.import({rpc: ['workspace', 'gotosymbol'], msg: 'clearLazy'});

export default {
  activate() {
    this.create();

    client.handle({ updateWorkspace: () => this.update() });
    client.onDetached(() => {
      this.ws.setItems([]);
      this.lazyTrees = [];
    });

    atom.config.observe('julia-client.uiOptions.layouts.workspace.defaultLocation', defaultLocation => {
      this.ws.setDefaultLocation(defaultLocation);
    });
  },

  lazyTrees: [],

  update() {
    if (!client.isActive() || !this.ws.currentPane()) { return this.ws.setItems([]); }
    clearLazy(this.lazyTrees);
    const registerLazy = id => this.lazyTrees.push(id);
    const mod = this.mod === modules.follow ? modules.current() : (this.mod || 'Main');
    const p = workspace(mod).then(ws => {
      for (let {items} of ws) {
        for (let item of items) {
          item.value = views.render(item.value, {registerLazy});
          item.onClick = this.onClick(item.name);
        }
      }
      this.ws.setItems(ws);
    });
    p.catch(function(err) {
      if (err !== 'disconnected') {
        console.error('Error refreshing workspace');
        console.error(err);
      }
    });
  },

  onClick(name) {
    return () => {
      const mod = this.mod === modules.follow ? modules.current() : (this.mod || 'Main');
      gotoSymbol({
        word: name,
        mod}).then(results => {
        if (results.error) { return; }
        goto.selectItemsAndGo(results.items);
      });
    };
  },

  create() {
    this.ws = this.ink.Workspace.fromId('julia');
    this.ws.setModule = mod => { return this.mod = mod; };
    this.ws.refresh = () => this.update();
    this.ws.refreshModule = () => {
      const m = modules.chooseModule();
      if ((m != null ? m.then : undefined) != null) {
        m.then(() => this.update());
      }
    };
  },

  open() {
    this.ws.open({
      split: atom.config.get('julia-client.uiOptions.layouts.workspace.split')});
  },

  close() {
    this.ws.close();
  }
};
