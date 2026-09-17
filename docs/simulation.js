export const STATIONS={muscle:{x:3.35,z:-1.1},liver:{x:-3.4,z:-3.4},fat:{x:-3.3,z:2.9}};
export class BodyCity{
 constructor(){this.reset()}
 reset(){Object.assign(this,{phase:'intro',time:0,score:0,bestCombo:0,combo:0,lastDrop:-99,cargo:[],items:[],serial:0,spawnTime:0,dropTime:0,helperTime:0,fat:2,ldlSpawnTime:0,capacity:8,helper:false,magnetCooldown:0,player:{x:0,z:3},events:[],seen:new Set(),intro:0,paused:false});}
 start(){this.phase='play';this.spawnSugar(7)}
 emit(type,data={}){this.events.push({type,...data})}
 spawnSugar(n){for(let i=0;i<n;i++)this.spawn('sugar',-.9+(i%3)*.9,-4.8-Math.floor(i/3)*.65)}
 spawn(type,x,z){if(this.items.length>=42)return;this.items.push({id:++this.serial,type,x,z,age:0,seed:this.serial*.83});}
 get insulin(){return Math.min(.7,Math.max(0,(this.fat-4)/15))}
 get bloodSugar(){return this.items.filter(x=>x.type==='sugar').length}
 get bloodLdl(){return this.items.filter(x=>x.type==='ldl').length}
 tick(dt){if(this.phase!=='play'||this.paused)return;dt=Math.min(.05,dt);this.time+=dt;this.magnetCooldown=Math.max(0,this.magnetCooldown-dt);this.spawnTime+=dt;this.dropTime+=dt;this.helperTime+=dt;this.ldlSpawnTime+=dt;
 const wave=this.time<18?0:this.time<36?1:2;
 if(this.spawnTime>(wave===0?1.3:wave===1?.82:.95)){this.spawnTime=0;this.spawnSugar(wave===1?2:1)}
 if(this.time>31&&this.ldlSpawnTime>Math.max(1,2.6-this.insulin*2)){this.ldlSpawnTime=0;this.spawn('ldl',-.8+Math.sin(this.time)*1.5,-4.7)}
 for(const t of [...this.items]){t.age+=dt;t.z+=dt*(t.type==='sugar'?.44:.31);t.x+=Math.sin(t.age+t.seed)*dt*.13;t.x=Math.max(-1.9,Math.min(1.9,t.x));if(t.type==='sugar'&&(t.age>12||t.z>3.5)){this.remove(t);this.fat=Math.min(22,this.fat+.7);this.emit('store',{item:t})}else if(t.z>4.8){t.z=-4.8;t.age=0}}
 // Qualitative accelerated demonstration, not a physiological prediction.
 for(const [at,key] of [[17,'storage'],[29,'insulin'],[41,'lipids']])if(this.time>=at&&!this.seen.has(key)){this.seen.add(key);this.phase='discovery';this.emit('discovery',{key});break}
 this.collect(1.05);
 for(const [name,station] of Object.entries(STATIONS)){if(name==='fat')continue;if(Math.hypot(this.player.x-station.x,this.player.z-station.z)<1.7&&this.dropTime>(name==='muscle'?.15+this.insulin*.34:.18)){const type=name==='muscle'?'sugar':'ldl';const i=this.cargo.findIndex(x=>x.type===type);if(i!==-1){const t=this.cargo.splice(i,1)[0];this.dropTime=0;this.deliver(t,name);}}}
 if(this.helper&&this.helperTime>1.2){this.helperTime=0;const t=this.items.find(x=>x.type==='ldl')||this.items[0];if(t){this.remove(t);this.deliver(t,t.type==='sugar'?'muscle':'liver',true)}}
 if(this.time>=60){this.phase='result';this.emit('end')}
 }
 remove(t){this.items=this.items.filter(i=>i!==t)}
 collect(radius){for(const t of [...this.items]){if(this.cargo.length>=this.capacity)break;if(Math.hypot(t.x-this.player.x,t.z-this.player.z)<radius){this.remove(t);this.cargo.push(t);this.emit('collect',{item:t})}}}
 deliver(t,station,helper=false){this.combo=this.time-this.lastDrop<2.3?this.combo+1:1;this.lastDrop=this.time;this.bestCombo=Math.max(this.bestCombo,this.combo);this.score++;this.emit('deliver',{item:t,station,combo:this.combo,helper});}
 move(x,z,dt){if(this.phase!=='play'||this.paused)return;const len=Math.hypot(x,z);if(len>1){x/=len;z/=len}this.player.x=Math.max(-4.7,Math.min(4.7,this.player.x+x*5*dt));this.player.z=Math.max(-5,Math.min(4.9,this.player.z+z*5*dt));}
 magnet(){if(this.phase!=='play'||this.paused||this.magnetCooldown>0)return false;this.magnetCooldown=8;this.collect(3.4);this.emit('magnet');return true}
 callHelper(){if(this.phase!=='play'||this.paused||this.score<5||this.helper)return false;this.helper=true;this.capacity=12;this.emit('helper');return true}
 resumeDiscovery(){if(this.phase==='discovery'){this.phase='play';this.emit('resume')}}
 snapshot(){return{phase:this.phase,time:Math.floor(this.time),deliveries:this.score,combo:this.bestCombo,cargo:this.cargo.length,capacity:this.capacity,sugar:this.bloodSugar,fat:Math.round(this.fat),ldl:this.bloodLdl,helper:this.helper,paused:this.paused,player:{...this.player}}}
}
