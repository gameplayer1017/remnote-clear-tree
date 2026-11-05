import { declareIndexPlugin, ReactRNPlugin, WidgetLocation, MessagingEvents } from '@remnote/plugin-sdk';
import { INLINE_POWERUP, InlineState, stateKey,hostCSS,HOST_STYLE_MESSAGE } from '../inline-state';
async function onActivate(plugin: ReactRNPlugin) {
  // RemNote allows host CSS registration only from the index widget.
  plugin.event.addListener(MessagingEvents.MessageBroadcast,undefined,async event=>{
    const message=event?.message??event;
    if(message?.type!==HOST_STYLE_MESSAGE||typeof message.id!=='string'||!/^[a-zA-Z0-9_-]+$/.test(message.id)||typeof message.active!=='boolean')return;
    await plugin.app.registerCSS(`inline-root-${message.id}`,message.active?hostCSS(message.id):'');
  });
  await plugin.app.registerPowerup({name:'Clear Tree Inline',code:INLINE_POWERUP,description:'이 항목을 원래 자리에서 가로 트리로 표시',options:{slots:[]}});
  await plugin.app.registerWidget('inline_tree', WidgetLocation.UnderRemEditor, {
    powerupFilter:INLINE_POWERUP, dimensions:{width:'100%',height:'auto'},
  });
  await plugin.app.registerCommand({
    id:'toggle-inline-tree',name:'Inline Tree · 트리 전환',keywords:'tree inline 트리 구조도',
    description:'이 항목의 원래 자리를 가로 트리로 전환하거나 일반 노트로 복구',
    action:async()=>{
      const focused=await plugin.focus.getFocusedRem();
      const selection=await plugin.editor.getSelectedRem();
      const rem=selection?.remIds?.[0] ? await plugin.rem.findOne(selection.remIds[0]) : focused;
      if(!rem){await plugin.app.toast('부모 Rem 한 줄에 커서를 놓고 실행하세요.');return;}
      if(await rem.hasPowerup(INLINE_POWERUP)){
        const state=await plugin.storage.getLocal<InlineState>(stateKey(rem._id));
        await plugin.app.registerCSS(`inline-root-${rem._id}`, '');
        await rem.removePowerup(INLINE_POWERUP);
        await rem.expand(state?.portalId,false);
      }else{
        const portal=await plugin.focus.getFocusedPortal();
        await plugin.storage.setLocal(stateKey(rem._id),{portalId:portal?._id});
        // Loading widget takes responsibility for collapsing only after rendering succeeds.
        await rem.addPowerup(INLINE_POWERUP);
      }
    },
  });
}
declareIndexPlugin(onActivate,async()=>{});
