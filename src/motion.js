// Motion preference. 'auto' follows the system reduced-motion setting; 'on' and 'still' are explicit choices saved on this device.
export const MOTION=Object.freeze(['auto','on','still']);
// Records saved before this setting existed kept only `reduced`. A saved still view is respected rather than guessed away.
export const storedMotion=saved=>MOTION.includes(saved?.motion)?saved.motion:saved?.reduced===true?'still':'auto';
export const isStill=(motion,systemReduced)=>motion==='still'||(motion==='auto'&&systemReduced);
// Toggling back to whatever the system asks for returns the choice to 'auto'.
export const toggledMotion=(motion,systemReduced)=>{const still=!isStill(motion,systemReduced);return still===systemReduced?'auto':still?'still':'on';};
export const motionNote=(motion,systemReduced)=>!isStill(motion,systemReduced)?'':motion==='auto'?'Still view follows your system’s reduced-motion setting. Parts do not turn; readouts, graph and timeline still update.':'Still view is saved on this device. Parts do not turn; readouts, graph and timeline still update.';
