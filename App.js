import React, { useState, useEffect, createContext, useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, Alert, TextInput, FlatList, Modal, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AppContext = createContext();

const TECH_QUESTIONS = [
  { q: "React'te state'i asenkron güncelleyen fonksiyon hangisidir?", a: "useState set", w: "useEffect", points: 150 },
  { q: "Git'te değişiklikleri geri almak için hangi komut kullanılır?", a: "git reset", w: "git push", points: 100 },
  { q: "HTTP 404 hata kodu ne anlama gelir?", a: "Not Found", w: "Server Error", points: 80 },
  { q: "JavaScript'te 'const' ile tanımlanan değişken:", a: "Değiştirilemez", w: "Her yerden erişilir", points: 120 },
  { q: "Mobil geliştirmede 'Expo' nedir?", a: "RN Framework", w: "Veritabanı", points: 100 },
  { q: "CSS'te 'Flexbox' ne için kullanılır?", a: "Yerleşim yönetimi", w: "Veri çekme", points: 90 }
];

const AppProvider = ({ children }) => {
  const [userData, setUserData] = useState({
    name: "Zeynep", githubUser: "zeynep", title: "Software Engineer Student", level: 1, xp: 0, techPoints: 30,
    githubStats: { repos: 0, followers: 0 },
    skills: [{ id: '1', name: 'React Native', progress: 0.1, color: '#61DBFB' }, { id: '2', name: 'Python & AI', progress: 0.1, color: '#3776AB' }],
    projects: []
  });
  const [toast, setToast] = useState(null), [isDeploying, setIsDeploying] = useState(false);

  // --- XP VE LEVEL TAKİPÇİSİ (Kritik Düzeltme) ---
  useEffect(() => {
    if (userData.xp >= 1000) {
      setUserData(p => ({
        ...p,
        level: p.level + 1,
        xp: p.xp - 1000 // Kalan XP bir sonraki seviyeye devredilir
      }));
      showToast("🎊 LEVEL UP! YENİ RÜTBE!");
    }
  }, [userData.xp]);

  const fetchGitHub = async (user) => {
    try {
      const res = await fetch(`https://api.github.com/users/${user}`);
      const data = await res.json();
      if (data.public_repos !== undefined) setUserData(p => ({ ...p, githubStats: { repos: data.public_repos, followers: data.followers } }));
    } catch (e) { console.log(e); }
  };

  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem('@dev_os_v7');
      if (saved) setUserData(JSON.parse(saved));
      fetchGitHub(userData.githubUser);
    })();
  }, []);

  useEffect(() => { AsyncStorage.setItem('@dev_os_v7', JSON.stringify(userData)); }, [userData]);

  const showToast = m => { setToast(m); setTimeout(() => setToast(null), 3000); };
  const getRank = l => l === 1 ? "Intern 🐣" : l < 4 ? "Junior 👨‍💻" : l < 7 ? "Mid-Level 🚀" : "Senior Architect 🏗️";

  const handleProjectAction = id => {
    setIsDeploying(true);
    setTimeout(() => {
      setUserData(p => ({
        ...p,
        projects: p.projects.map(x => x.id === id ? { ...x, completed: true } : x),
        xp: p.xp + 350,
        techPoints: p.techPoints + 25
      }));
      setIsDeploying(false); showToast("🚀 Deployment Success!");
    }, 2500);
  };

  return <AppContext.Provider value={{ userData, setUserData, handleProjectAction, toast, isDeploying, getRank, showToast, fetchGitHub }}>{children}</AppContext.Provider>;
};

const IDCardScreen = () => {
  const { userData, setUserData, getRank, showToast } = useContext(AppContext);
  const [modal, setModal] = useState(false), [skill, setSkill] = useState('');

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.cardWrapper}>
        <View style={styles.idCard}>
          <View style={styles.cardHeader}><Text style={styles.chipText}>ID: {userData.githubUser.toUpperCase()}</Text><View style={styles.levelBadge}><Text style={styles.levelText}>LVL {userData.level}</Text></View></View>
          <View style={styles.profileRow}><View style={styles.avatarLarge}><Text style={{fontSize: 40}}>👩‍💻</Text></View><View style={{flex:1}}><Text style={styles.nameText}>{userData.name}</Text><Text style={styles.rankTitle}>{getRank(userData.level)}</Text></View></View>
          <View style={styles.githubStatsRow}>{[{v:userData.githubStats.repos, l:"REPOS"}, {v:userData.githubStats.followers, l:"FOLLOWERS"}].map((s,i)=><View key={i} style={styles.statBox}><Text style={styles.statVal}>{s.v}</Text><Text style={styles.statLab}>{s.l}</Text></View>)}</View>
          <View style={styles.xpSection}><View style={styles.xpHeader}><Text style={styles.xpSmall}>XP PROGRESS</Text><Text style={styles.xpSmall}>{userData.xp}/1000</Text></View><View style={styles.progressBarBg}><View style={[styles.progressBarFill, { width: `${(userData.xp / 1000) * 100}%` }]} /></View></View>
        </View>
      </View>
      <View style={styles.sectionRow}><Text style={styles.sectionHeader}>Yetenekler</Text><TouchableOpacity style={styles.miniBtn} onPress={()=>setModal(true)}><Text style={styles.miniBtnText}>+ EKLE</Text></TouchableOpacity></View>
      <ScrollView horizontal style={styles.skillScroll}>{userData.skills.map(s => <View key={s.id} style={styles.skillNode}><View style={[styles.skillRing, {borderColor: s.color}]}><Text style={{color: s.color, fontSize: 12, fontWeight: 'bold'}}>{Math.round(s.progress * 100)}%</Text></View><Text style={styles.skillNodeName}>{s.name}</Text></View>)}</ScrollView>
      <Modal visible={modal} transparent animationType="fade"><View style={styles.modalOverlay}><View style={styles.modalCard}><Text style={styles.modalTitle}>Yetenek Ekle</Text><TextInput style={styles.input} placeholderTextColor="#444" value={skill} onChangeText={setSkill} /><TouchableOpacity style={styles.submitBtn} onPress={()=>{if(!skill)return;setUserData(p=>({...p,skills:[...p.skills,{id:Date.now().toString(),name:skill,progress:0,color:'#00FF41'}]}));setSkill('');setModal(false);showToast("Eklendi!");}}><Text style={styles.btnTxtDark}>KAYDET</Text></TouchableOpacity><TouchableOpacity style={{marginTop:10}} onPress={()=>setModal(false)}><Text style={{color:'#666', textAlign:'center'}}>Kapat</Text></TouchableOpacity></View></View></Modal>
    </SafeAreaView>
  );
};

const TerminalScreen = () => {
  const { userData, setUserData, showToast } = useContext(AppContext);
  const [quiz, setQuiz] = useState(false), [q, setQ] = useState(TECH_QUESTIONS[0]), [timer, setTimer] = useState(1500), [active, setActive] = useState(false), [opts, setOpts] = useState([]);

  useEffect(() => {
    let int = active && timer > 0 && setInterval(() => setTimer(t => t - 1), 1000);
    if (timer === 0) { showToast("🎯 Sprint Finished!"); setUserData(p => ({ ...p, xp: p.xp + 200 })); setActive(false); setTimer(1500); }
    return () => clearInterval(int);
  }, [active, timer]);

  const startQuiz = () => {
    const sel = TECH_QUESTIONS[Math.floor(Math.random()*TECH_QUESTIONS.length)];
    setQ(sel); setOpts([{t: sel.a, c: true}, {t: sel.w, c: false}].sort(() => Math.random() - 0.5));
    setQuiz(true);
  };

  const handleQuiz = c => {
    if (c) { setUserData(p => ({ ...p, xp: p.xp + q.points, techPoints: p.techPoints + 10 })); showToast(`✅ +${q.points} XP`); }
    else Alert.alert("Hatalı!");
    setQuiz(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.terminalHeader}><Text style={styles.terminalTitle}>DEV_TERMINAL_V3</Text></View>
      <View style={styles.toolCard}><Text style={styles.toolTitle}>🧠 Knowledge Quiz</Text><TouchableOpacity style={styles.toolBtn} onPress={startQuiz}><Text style={styles.btnTxtDark}>START</Text></TouchableOpacity></View>
      <View style={styles.toolCard}><Text style={styles.toolTitle}>⏱️ Focus Sprint</Text><Text style={styles.timerText}>{Math.floor(timer/60)}:{String(timer%60).padStart(2,'0')}</Text><TouchableOpacity style={[styles.toolBtn, active && {backgroundColor:'#FF4757'}]} onPress={()=>setActive(!active)}><Text style={styles.btnTxtDark}>{active ? "STOP" : "START"}</Text></TouchableOpacity></View>
      <Modal visible={quiz} transparent><View style={styles.modalOverlay}><View style={styles.modalCard}><Text style={styles.modalTitle}>{q.q}</Text>{opts.map((o,i)=><TouchableOpacity key={i} style={styles.ansBtn} onPress={()=>handleQuiz(o.c)}><Text style={styles.ansTxt}>{o.t}</Text></TouchableOpacity>)}</View></View></Modal>
    </SafeAreaView>
  );
};

const ProjectHub = () => {
  const { userData, setUserData, handleProjectAction, isDeploying } = useContext(AppContext);
  const [modal, setModal] = useState(false), [title, setTitle] = useState('');

  return (
    <SafeAreaView style={styles.container}>
      {isDeploying && <View style={styles.deployOverlay}><ActivityIndicator size="large" color="#00FF41" /><Text style={styles.deployText}>DEPLOYING...</Text></View>}
      <View style={styles.sectionRow}><Text style={styles.sectionHeader}>Repo Hub</Text><TouchableOpacity style={styles.mainAddBtn} onPress={()=>setModal(true)}><Text style={styles.btnTxtDark}>+ NEW</Text></TouchableOpacity></View>
      <FlatList data={userData.projects} renderItem={({item}) => <View style={[styles.projectItem, item.completed && {opacity:0.4}]}><View style={{flex:1}}><Text style={styles.projectTitle}>{item.title}</Text><Text style={styles.projectMeta}>{item.completed ? "YAYINDA" : "GELİŞTİRİLİYOR"}</Text></View>{!item.completed && <TouchableOpacity style={styles.deployBtn} onPress={()=>handleProjectAction(item.id)}><Text style={styles.deployBtnTxt}>BİTİR</Text></TouchableOpacity>}</View>} />
      <Modal visible={modal} transparent animationType="slide"><View style={styles.modalOverlay}><View style={styles.modalCard}><Text style={styles.modalTitle}>Proje Adı</Text><TextInput style={styles.input} placeholderTextColor="#444" value={title} onChangeText={setTitle} /><TouchableOpacity style={styles.submitBtn} onPress={()=>{if(!title)return;setUserData(p=>({...p, projects:[{id:Date.now().toString(),title,completed:false},...p.projects]}));setTitle('');setModal(false);}}><Text style={styles.btnTxtDark}>OLUŞTUR</Text></TouchableOpacity></View></View></Modal>
    </SafeAreaView>
  );
};

const SkillTree = () => {
  const { userData, setUserData, showToast } = useContext(AppContext);
  const up = id => {
    if (userData.techPoints < 10) return Alert.alert("Yetersiz TP");
    setUserData(p => ({ ...p, techPoints: p.techPoints - 10, skills: p.skills.map(s => s.id === id ? { ...s, progress: Math.min(1, s.progress + 0.1) } : s) }));
    showToast("🚀 Upgraded!");
  };
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.tpHeader}><Text style={styles.tpText}>RESOURCES: {userData.techPoints} TP 💎</Text></View>
      <ScrollView style={{padding:20}}>{userData.skills.map(s => <View key={s.id} style={styles.upgradeCard}><View style={{flex:1}}><Text style={styles.skillLabel}>{s.name}</Text><View style={styles.miniBarBg}><View style={[styles.miniBarFill, {width:`${s.progress*100}%`, backgroundColor:s.color}]} /></View></View><TouchableOpacity style={styles.upActionBtn} onPress={()=>up(s.id)}><Text style={styles.upActionTxt}>UPGRADE</Text></TouchableOpacity></View>)}</ScrollView>
    </SafeAreaView>
  );
};

const Tab = createBottomTabNavigator();
export default function App() {
  return (
    <AppProvider><AppContext.Consumer>{({ toast }) => (
      <NavigationContainer>
        {toast && <View style={styles.toast}><Text style={styles.toastText}>{toast}</Text></View>}
        <Tab.Navigator screenOptions={{ headerShown: false, tabBarStyle: { backgroundColor: '#000', borderTopWidth: 0 }, tabBarActiveTintColor: '#00FF41' }}>
          <Tab.Screen name="Kartım" component={IDCardScreen} /><Tab.Screen name="Terminal" component={TerminalScreen} /><Tab.Screen name="Projeler" component={ProjectHub} /><Tab.Screen name="Gelişim" component={SkillTree} />
        </Tab.Navigator>
      </NavigationContainer>
    )}</AppContext.Consumer></AppProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050505' },
  toast: { position: 'absolute', top: 50, left: 20, right: 20, backgroundColor: '#00FF41', padding: 15, borderRadius: 12, zIndex: 9999, alignItems: 'center' },
  toastText: { color: '#000', fontWeight: 'bold' },
  cardWrapper: { padding: 20, marginTop: 40 },
  idCard: { backgroundColor: '#0F0F0F', borderRadius: 25, padding: 25, borderWidth: 1, borderColor: '#1A1A1A' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  chipText: { color: '#333', fontSize: 10, fontFamily: 'monospace' },
  levelBadge: { backgroundColor: '#00FF41', paddingHorizontal: 12, borderRadius: 6 },
  levelText: { fontWeight: 'bold', fontSize: 12, color: '#000' },
  profileRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  avatarLarge: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#1A1A1A', justifyContent: 'center', alignItems: 'center', marginRight: 15, borderWidth: 1, borderColor: '#333' },
  nameText: { color: '#FFF', fontSize: 22, fontWeight: 'bold' },
  rankTitle: { color: '#00FF41', fontSize: 13, marginTop: 4 },
  githubStatsRow: { flexDirection: 'row', justifyContent: 'space-around', marginVertical: 15, backgroundColor: '#151515', padding: 10, borderRadius: 15 },
  statBox: { alignItems: 'center' },
  statVal: { color: '#FFF', fontWeight: 'bold', fontSize: 18 },
  statLab: { color: '#444', fontSize: 10 },
  xpSection: { marginBottom: 10 },
  xpHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  xpSmall: { color: '#444', fontSize: 10 },
  progressBarBg: { height: 8, backgroundColor: '#1A1A1A', borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#00FF41' },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  sectionHeader: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  miniBtn: { backgroundColor: '#1A1A1A', padding: 10, borderRadius: 10 },
  miniBtnText: { color: '#00FF41', fontSize: 11, fontWeight: 'bold' },
  skillScroll: { paddingLeft: 20 },
  skillNode: { alignItems: 'center', marginRight: 25 },
  skillRing: { width: 60, height: 60, borderRadius: 30, borderWidth: 2, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0A0A0A' },
  skillNodeName: { color: '#555', fontSize: 11, marginTop: 5 },
  terminalHeader: { padding: 20, backgroundColor: '#0F0F0F' },
  terminalTitle: { color: '#00FF41', fontWeight: 'bold', fontFamily: 'monospace' },
  toolCard: { backgroundColor: '#0F0F0F', margin: 20, padding: 25, borderRadius: 25, borderWidth: 1, borderColor: '#1A1A1A', alignItems: 'center' },
  toolTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  toolBtn: { backgroundColor: '#00FF41', paddingHorizontal: 25, paddingVertical: 12, borderRadius: 12 },
  timerText: { color: '#FFF', fontSize: 50, fontWeight: 'bold', marginVertical: 15, fontFamily: 'monospace' },
  deployOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  deployText: { color: '#00FF41', fontWeight: 'bold', marginTop: 15 },
  projectItem: { backgroundColor: '#0F0F0F', marginHorizontal: 20, marginBottom: 15, padding: 20, borderRadius: 20, flexDirection: 'row', alignItems: 'center' },
  projectTitle: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  projectMeta: { color: '#444', fontSize: 11, marginTop: 5 },
  deployBtn: { backgroundColor: '#00FF41', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 10 },
  deployBtnTxt: { color: '#000', fontWeight: 'bold', fontSize: 12 },
  mainAddBtn: { backgroundColor: '#00FF41', padding: 12, borderRadius: 12 },
  btnTxtDark: { color: '#000', fontWeight: 'bold' },
  tpHeader: { padding: 25, backgroundColor: '#0F0F0F' },
  tpText: { color: '#00FF41', fontWeight: 'bold', textAlign: 'center' },
  upgradeCard: { backgroundColor: '#0F0F0F', padding: 20, borderRadius: 20, marginBottom: 12, flexDirection: 'row', alignItems: 'center' },
  skillLabel: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  miniBarBg: { height: 4, backgroundColor: '#1A1A1A', marginTop: 12, borderRadius: 2 },
  miniBarFill: { height: '100%', borderRadius: 2 },
  upActionBtn: { backgroundColor: '#1A1A1A', padding: 12, borderRadius: 12 },
  upActionTxt: { color: '#00FF41', fontSize: 10, fontWeight: 'bold' },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.9)' },
  modalCard: { width: '85%', backgroundColor: '#0F0F0F', padding: 30, borderRadius: 30 },
  modalTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold', marginBottom: 25, textAlign: 'center' },
  input: { backgroundColor: '#050505', color: '#FFF', padding: 18, borderRadius: 15, marginBottom: 20 },
  submitBtn: { backgroundColor: '#00FF41', padding: 18, borderRadius: 15, alignItems: 'center' },
  ansBtn: { backgroundColor: '#1A1A1A', padding: 15, borderRadius: 15, width: '100%', marginBottom: 10 },
  ansTxt: { color: '#FFF', textAlign: 'center', fontWeight: 'bold' }
});