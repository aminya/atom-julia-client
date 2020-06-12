'use babel'
import { client } from '../connection';
import { views } from '../ui';
import goto from './goto';
import modules from './modules';

const { workspace, gotosymbol: gotoSymbol, clearLazy } = client.import({rpc: ['workspace', 'gotosymbol'], msg: 'clearLazy'});

let ws;
export function activate() {
    create();

    client.handle({ updateWorkspace: () => update() });
    client.onDetached(() => {
      ws.setItems([]);
      lazyTrees = [];
    });

    atom.config.observe('julia-client.uiOptions.layouts.workspace.defaultLocation', defaultLocation => {
      ws.setDefaultLocation(defaultLocation);
    });
}

export let lazyTrees= []

export function update() {
    if (!client.isActive() || !ws.currentPane()) { return ws.setItems([]); }
    clearLazy(lazyTrees);
    const registerLazy = id => lazyTrees.push(id);
    const mod = mod === modules.follow ? modules.current() : (mod || 'Main');
    const p = workspace(mod).then(ws => {
      for (let {items} of ws) {
        for (let item of items) {
          item.value = views.render(item.value, {registerLazy});
          item.onClick = onClick(item.name);
        }
      }
      ws.setItems(ws);
    });
    p.catch(function(err) {
      if (err !== 'disconnected') {
        console.error('Error refreshing workspace');
        console.error(err);
      }
    });
}

export function onClick(name) {
    return () => {
      const mod = mod === modules.follow ? modules.current() : (mod || 'Main');
      gotoSymbol({
        word: name,
        mod}).then(results => {
        if (results.error) { return; }
        goto.selectItemsAndGo(results.items);
      });
    };
}

export function create() {
    ws = ink.Workspace.fromId('julia');
    ws.setModule = mod => { return mod = mod; };
    ws.refresh = () => update();
    ws.refreshModule = () => {
      const m = modules.chooseModule();
      if ((m != null ? m.then : undefined) != null) {
        m.then(() => update());
      }
    };
}

export function open() {
    ws.open({
      split: atom.config.get('julia-client.uiOptions.layouts.workspace.split')});
}

export function close() {
    ws.close();
}

