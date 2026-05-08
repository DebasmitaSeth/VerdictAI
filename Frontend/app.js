/* ══════════════════════════════════════════════════════════════
   VerdictAI · AI Judgment Intelligence Platform
   app.js — Complete Application Logic
   Sections:
     0.  Global State
     1.  Mock Data
     2.  Utilities
     3.  Page Navigation
     4.  Auth (login.html)
     5.  Logout / User Session
     6.  Dashboard
     7.  Upload Pipeline
     8.  Extraction View
     9.  Action Plan
     10. Verification Queue
     11. Verified Records
     12. Reports
     13. Settings
     14. Notifications
     15. Profile Modal
     16. Modals / Edit Field
     17. DOMContentLoaded Init
══════════════════════════════════════════════════════════════ */
'use strict';

/* ════════════════════════════════════════════════════════════
   0. GLOBAL STATE
════════════════════════════════════════════════════════════ */
const STATE = {
  currentPage:        'dashboard',
  currentUser:        null,
  selectedQueueItem:  null,
  verifiedFilter:     'all',
  approvedCount:      0,
  pdfZoom:            1,
  notifications:      [],
  unreadNotifCount:   0,
  settingsTab:        'profile',
};

/* ════════════════════════════════════════════════════════════
   1. MOCK DATA
════════════════════════════════════════════════════════════ */
const CASES = [
  { id:0, caseNo:'WP/14832/2024', date:'15 Mar 2024', dept:'Revenue', nature:'Service Matter',   status:'pending',   aiScore:94, score_class:'high', petitioner:'Rajesh Kumar Sharma',         respondent:'State of Karnataka & Ors.',      court:'High Court of Karnataka',  bench:'Justice A.K. Verma, Justice S. Reddy', disposal:'Disposed of',         orderDate:'15 Mar 2024', limitation:'90 days (appeal)',      actionType:'compliance' },
  { id:1, caseNo:'SLP/8901/2024',  date:'02 Apr 2024', dept:'Finance', nature:'Tax Dispute',      status:'extracted', aiScore:87, score_class:'high', petitioner:'Patel Industries Pvt. Ltd.',  respondent:'Revenue Department',             court:'Supreme Court of India',   bench:'Justice M. Sharma',                    disposal:'Remanded',            orderDate:'02 Apr 2024', limitation:'30 days (compliance)',  actionType:'appeal'     },
  { id:2, caseNo:'WP/22107/2023',  date:'18 Jan 2024', dept:'Urban',   nature:'Contempt',         status:'critical',  aiScore:78, score_class:'med',  petitioner:'Municipal Corp of Bangalore', respondent:'State Govt & Citizens',          court:'High Court of Karnataka',  bench:'Justice R. Iyer',                      disposal:'Contempt Notice',     orderDate:'18 Jan 2024', limitation:'15 days (urgent)',      actionType:'compliance' },
  { id:3, caseNo:'CRP/5544/2024',  date:'10 Feb 2024', dept:'PWD',     nature:'Land Dispute',     status:'verified',  aiScore:91, score_class:'high', petitioner:'Farmers Welfare Assoc.',     respondent:'PWD & Land Acquisition',         court:'High Court of Karnataka',  bench:'Justice P. Nair',                      disposal:'Disposed of',         orderDate:'10 Feb 2024', limitation:'60 days',               actionType:'compliance' },
  { id:4, caseNo:'WA/1120/2024',   date:'28 Feb 2024', dept:'Home',    nature:'Service Matter',   status:'pending',   aiScore:72, score_class:'med',  petitioner:'IPS Officers Assoc.',        respondent:'Home Department',                court:'Division Bench HC',        bench:'Justice K. Rao, Justice L. Das',       disposal:'Partial Relief',      orderDate:'28 Feb 2024', limitation:'45 days',               actionType:'appeal'     },
  { id:5, caseNo:'WP/33901/2023',  date:'05 Nov 2023', dept:'Revenue', nature:'Land Acquisition', status:'verified',  aiScore:96, score_class:'high', petitioner:'Krishnamurthy & Ors.',       respondent:'BDA & State Govt',               court:'High Court of Karnataka',  bench:'Justice S. Menon',                     disposal:'Disposed of',         orderDate:'05 Nov 2023', limitation:'Expired',               actionType:'compliance' },
];

const DEADLINES = [
  { caseNo:'WP/22107/2023', desc:'File compliance report — contempt',   daysLeft:3,  urgency:'red'   },
  { caseNo:'SLP/8901/2024', desc:'Decision on appeal filing',            daysLeft:8,  urgency:'red'   },
  { caseNo:'WP/14832/2024', desc:'Grant personal hearing to petitioner', daysLeft:14, urgency:'amber' },
  { caseNo:'WA/1120/2024',  desc:'Submit departmental response',         daysLeft:21, urgency:'amber' },
  { caseNo:'CRP/5544/2024', desc:'Compliance report to court',           daysLeft:38, urgency:'green' },
];

const DEPT_DIST = [
  { name:'Revenue Department', count:72, pct:100 },
  { name:'Public Works (PWD)', count:51, pct:70  },
  { name:'Finance Dept',       count:44, pct:61  },
  { name:'Home Department',    count:38, pct:52  },
  { name:'Urban Development',  count:29, pct:40  },
  { name:'Other Departments',  count:13, pct:18  },
];

const EXTRACTION_DATA = [
  {
    caseNo:'WP/14832/2024', confidence:94,
    details:[
      { label:'Case Number',   value:'WP/14832/2024'                       },
      { label:'Court',         value:'High Court of Karnataka'              },
      { label:'Bench',         value:'Justice A.K. Verma, Justice S. Reddy'},
      { label:'Date of Order', value:'15th March, 2024'                    },
      { label:'Case Type',     value:'Writ Petition (Civil)'               },
      { label:'Disposal',      value:'Disposed of'                         },
    ],
    parties:[
      { role:'Petitioner',   name:'Rajesh Kumar Sharma',            tag:'Petitioner' },
      { role:'Respondent 1', name:'State of Karnataka',             tag:'State'      },
      { role:'Respondent 2', name:'Principal Secretary, Revenue',   tag:'Respondent' },
      { role:'Respondent 3', name:'District Collector, Bengaluru',  tag:'Respondent' },
    ],
    directions:[
      { text:'The respondent State is directed to grant the petitioner a personal hearing within 30 days from today.',                  type:'critical',  tag:'Critical'  },
      { text:'The concerned department shall file a compliance report before this Court within 45 days.',                               type:'important', tag:'Important' },
      { text:'Failure to comply shall attract consequences under Contempt of Courts Act, 1971.',                                        type:'critical',  tag:'Critical'  },
      { text:'The writ petition is accordingly disposed of with liberty to approach Court if non-compliance occurs.',                   type:'standard',  tag:'Standard'  },
    ],
    timelines:[
      { event:'Grant Personal Hearing',     date:'14 Apr 2024', daysLeft:'14 days left', urgency:'red'   },
      { event:'File Compliance Report',     date:'29 Apr 2024', daysLeft:'29 days left', urgency:'amber' },
      { event:'Limitation Period — Appeal', date:'15 Jun 2024', daysLeft:'76 days left', urgency:'blue'  },
    ],
  },
  {
    caseNo:'SLP/8901/2024', confidence:87,
    details:[
      { label:'Case Number',   value:'SLP/8901/2024'          },
      { label:'Court',         value:'Supreme Court of India' },
      { label:'Bench',         value:'Justice M. Sharma'      },
      { label:'Date of Order', value:'2nd April, 2024'        },
      { label:'Case Type',     value:'Special Leave Petition' },
      { label:'Disposal',      value:'Remanded to HC'         },
    ],
    parties:[
      { role:'Petitioner',   name:'Patel Industries Pvt. Ltd.',    tag:'Petitioner' },
      { role:'Respondent 1', name:'Revenue Department, Karnataka', tag:'Respondent' },
    ],
    directions:[
      { text:'Matter remanded to the High Court for fresh consideration on merits of tax assessment.',  type:'important', tag:'Important' },
      { text:'Revenue Department directed to provide all relevant records within 30 days.',             type:'critical',  tag:'Critical'  },
      { text:'High Court to take up matter within 60 days of receipt of remand order.',                type:'standard',  tag:'Standard'  },
    ],
    timelines:[
      { event:'Provide Records to HC', date:'02 May 2024', daysLeft:'8 days left',  urgency:'red'   },
      { event:'HC Hearing Scheduled',  date:'02 Jun 2024', daysLeft:'39 days left', urgency:'amber' },
    ],
  },
  {
    caseNo:'WP/22107/2023', confidence:78,
    details:[
      { label:'Case Number',   value:'WP/22107/2023'               },
      { label:'Court',         value:'High Court of Karnataka'      },
      { label:'Bench',         value:'Justice R. Iyer'             },
      { label:'Date of Order', value:'18th January, 2024'          },
      { label:'Case Type',     value:'Contempt of Court'           },
      { label:'Disposal',      value:'Contempt Notice Issued'      },
    ],
    parties:[
      { role:'Petitioner',   name:'Citizens for Clean City (NGO)',      tag:'Petitioner' },
      { role:'Respondent 1', name:'Municipal Corporation of Bangalore', tag:'Respondent' },
      { role:'Respondent 2', name:'State Government of Karnataka',      tag:'Respondent' },
    ],
    directions:[
      { text:'Municipal Corporation to appear and show cause for non-compliance with earlier order dated 10 Oct 2023.',    type:'critical', tag:'Critical' },
      { text:'Commissioner, BBMP personally directed to file affidavit explaining non-compliance within 15 days.',        type:'critical', tag:'Critical' },
      { text:'Contempt proceedings initiated under Section 12 of the Contempt of Courts Act, 1971.',                      type:'critical', tag:'Critical' },
    ],
    timelines:[
      { event:'File Affidavit of Non-Compliance', date:'02 Feb 2024', daysLeft:'3 days left!', urgency:'red'   },
      { event:'Contempt Hearing',                 date:'15 Feb 2024', daysLeft:'16 days left', urgency:'amber' },
    ],
  },
];

const ACTION_PLANS = [
  {
    caseNo:'WP/14832/2024', recommendation:'COMPLY WITH ORDER', emoji:'⚖️',
    reason:'Strong direction with contempt clause — compliance is mandatory within 30 days',
    confidence:88,
    actions:[
      { title:'Schedule Personal Hearing',  desc:'Coordinate with petitioner and fix a date within 30 days as directed by the Court.', priority:'urgent', icon:'📅', tags:['30 days','Revenue Dept'], bg:'#fef2f2' },
      { title:'Prepare Compliance Report',  desc:'Draft compliance report for submission to High Court within 45 days.',               priority:'high',   icon:'📝', tags:['45 days','Legal Cell'],   bg:'#fffbeb' },
      { title:'Evaluate Appeal Options',    desc:'Assess merits and grounds for appeal within 90-day limitation period.',             priority:'medium', icon:'🔍', tags:['90 days','Law Dept'],     bg:'#f0f7ff' },
      { title:'Notify Principal Secretary', desc:'Inform senior officials of order and all compliance requirements immediately.',      priority:'low',    icon:'📤', tags:['Immediate','Admin'],      bg:'#f0fdf4' },
    ],
    timeline:[
      { day:'Day 0',  title:'Order Received',        desc:'Judgment fetched via CIS API and queued for processing',         state:'done',   date:'15 Mar 2024' },
      { day:'Day 5',  title:'Internal Review',        desc:'Legal cell reviews order and assesses all implications',         state:'done',   date:'20 Mar 2024' },
      { day:'Day 14', title:'Fix Hearing Date',       desc:'Schedule and notify petitioner of personal hearing date',        state:'active', date:'29 Mar 2024' },
      { day:'Day 30', title:'Conduct Hearing',        desc:'Conduct personal hearing as directed by court',                  state:'',       date:'14 Apr 2024' },
      { day:'Day 45', title:'File Compliance Report', desc:'Submit compliance affidavit to the High Court',                  state:'urgent', date:'29 Apr 2024' },
      { day:'Day 90', title:'Appeal Deadline',        desc:'Last date for filing appeal if decision is taken',               state:'',       date:'15 Jun 2024' },
    ],
    departments:[
      { abbr:'RD', name:'Revenue Department',       role:'Primary respondent — responsible for scheduling hearing', badge:'primary' },
      { abbr:'LC', name:'Legal Cell',               role:'Draft compliance report and coordinate court filings',    badge:'primary' },
      { abbr:'LD', name:'Law Department',           role:'Advise on appeal viability and legal strategy',           badge:'support' },
      { abbr:'CS', name:"Chief Secretary's Office", role:'Senior oversight, approval and escalation',              badge:'support' },
    ],
    risks:[
      { level:'HIGH',   title:'Contempt Risk',     desc:'Non-compliance may invite contempt proceedings against officers', cls:'h' },
      { level:'HIGH',   title:'Deadline Pressure', desc:'30-day window is tight for typical administrative process',       cls:'h' },
      { level:'MEDIUM', title:'Legal Precedent',   desc:'Order may set precedent for similar pending service cases',       cls:'m' },
      { level:'LOW',    title:'Budget Impact',     desc:'Potential cost implications if appeal is filed and lost',         cls:'l' },
    ],
  },
  {
    caseNo:'SLP/8901/2024', recommendation:'FILE APPEAL — SLP', emoji:'🏛️',
    reason:'Tax reassessment order appears erroneous — strong grounds for appeal within 30 days',
    confidence:82,
    actions:[
      { title:'Engage Senior Counsel',    desc:"Brief Advocate General's office on grounds for SLP within 7 days.",          priority:'urgent', icon:'👨‍⚖️', tags:['7 days','Law Dept'],     bg:'#fef2f2' },
      { title:'Compile Case Records',     desc:'Gather all tax assessment records for submission to court.',                  priority:'high',   icon:'📂', tags:['30 days','Revenue'],     bg:'#fffbeb' },
      { title:'Draft SLP Petition',       desc:'Legal cell to draft Special Leave Petition for Supreme Court.',              priority:'high',   icon:'📝', tags:['30 days','Legal Cell'],   bg:'#f0f7ff' },
      { title:'Internal Approval',        desc:'Obtain approval from Secretary and Finance Minister before filing.',         priority:'medium', icon:'✅', tags:['Immediate','Finance'],    bg:'#f0fdf4' },
    ],
    timeline:[
      { day:'Day 0',  title:'Order Received',    desc:'SLP order fetched from SC portal',                  state:'done',   date:'02 Apr 2024' },
      { day:'Day 7',  title:'Engage Counsel',    desc:'Brief Advocate General on appeal grounds',          state:'active', date:'09 Apr 2024' },
      { day:'Day 15', title:'Draft Petition',    desc:'Complete SLP petition draft for internal review',   state:'',       date:'17 Apr 2024' },
      { day:'Day 25', title:'Internal Approval', desc:'Get sign-off from Secretary and Minister',          state:'',       date:'27 Apr 2024' },
      { day:'Day 30', title:'File SLP',          desc:'File Special Leave Petition before Supreme Court',  state:'urgent', date:'02 May 2024' },
    ],
    departments:[
      { abbr:'FD', name:'Finance Department',  role:'Primary respondent — provide financial records',     badge:'primary' },
      { abbr:'LC', name:'Legal Cell',          role:'Draft and file the SLP petition',                    badge:'primary' },
      { abbr:'AG', name:"Advocate General's Office", role:'Represent state in Supreme Court',             badge:'primary' },
      { abbr:'LD', name:'Law Department',      role:'Legal strategy and liaison',                         badge:'support' },
    ],
    risks:[
      { level:'HIGH',   title:'Missed Limitation', desc:'SLP must be filed within 30 days — strict deadline', cls:'h' },
      { level:'MEDIUM', title:'Financial Exposure', desc:'Tax liability if appeal fails in Supreme Court',    cls:'m' },
      { level:'LOW',    title:'Precedent Risk',     desc:'Adverse ruling could impact similar tax cases',     cls:'l' },
      { level:'LOW',    title:'Resource Cost',      desc:'Legal costs for Supreme Court appearance',          cls:'l' },
    ],
  },
  {
    caseNo:'WP/22107/2023', recommendation:'URGENT COMPLIANCE', emoji:'🚨',
    reason:'Contempt notice issued — personal compliance by BBMP Commissioner required within 3 days',
    confidence:96,
    actions:[
      { title:'File Commissioner Affidavit', desc:'BBMP Commissioner to file personal affidavit within 3 days.',        priority:'urgent', icon:'🚨', tags:['3 days','BBMP'],         bg:'#fef2f2' },
      { title:'Show Cause Response',         desc:'Prepare detailed show cause response for contempt proceedings.',     priority:'urgent', icon:'⚠️', tags:['3 days','Legal Cell'],   bg:'#fef2f2' },
      { title:'Submit Compliance Plan',      desc:'Present concrete timeline for fulfilling original court order.',     priority:'high',   icon:'📋', tags:['15 days','BBMP/Urban'], bg:'#fffbeb' },
      { title:'Escalate to Chief Minister',  desc:'Brief CM office given gravity of contempt proceedings.',            priority:'high',   icon:'📤', tags:['Immediate','CMO'],       bg:'#fff7ed' },
    ],
    timeline:[
      { day:'Day 0',  title:'Contempt Notice',       desc:'Notice received, immediate action required',               state:'done',   date:'18 Jan 2024' },
      { day:'Day 1',  title:'Engage Senior Advocate', desc:'Brief advocate on contempt proceedings immediately',      state:'active', date:'19 Jan 2024' },
      { day:'Day 3',  title:'File Affidavit',        desc:'Commissioner to file personal affidavit in High Court',   state:'urgent', date:'21 Jan 2024' },
      { day:'Day 15', title:'Contempt Hearing',      desc:'Appear before court for contempt hearing',                state:'',       date:'02 Feb 2024' },
    ],
    departments:[
      { abbr:'BB', name:'BBMP',              role:'Direct respondent — Commissioner personally liable',   badge:'primary' },
      { abbr:'UD', name:'Urban Development', role:'Coordinate state response and compliance plan',        badge:'primary' },
      { abbr:'LC', name:'Legal Cell',        role:'Prepare affidavit and court documents',               badge:'primary' },
      { abbr:'CS', name:"Chief Secretary",   role:'Senior escalation and oversight',                     badge:'support' },
    ],
    risks:[
      { level:'HIGH',   title:'Personal Liability',  desc:'Commissioner faces personal contempt action if default',  cls:'h' },
      { level:'HIGH',   title:'Imprisonment Risk',   desc:'Contempt may attract fine or imprisonment under law',     cls:'h' },
      { level:'HIGH',   title:'Reputational Damage', desc:'Contempt proceedings are public record',                 cls:'h' },
      { level:'MEDIUM', title:'Cascading Orders',    desc:'Further non-compliance may attract stronger orders',     cls:'m' },
    ],
  },
];

const QUEUE_ITEMS = [
  { id:'q1', caseNo:'WP/14832/2024', desc:'Service Matter — Revenue Dept',  time:'2h ago', conf:94, confCls:'high', status:'pending', extractIdx:0 },
  { id:'q2', caseNo:'SLP/8901/2024', desc:'Tax Dispute — Finance Dept',     time:'3h ago', conf:87, confCls:'high', status:'pending', extractIdx:1 },
  { id:'q3', caseNo:'WP/22107/2023', desc:'Contempt — BBMP vs Citizens',    time:'5h ago', conf:78, confCls:'med',  status:'pending', extractIdx:2 },
  { id:'q4', caseNo:'CRP/5544/2024', desc:'Land Dispute — PWD',             time:'8h ago', conf:91, confCls:'high', status:'pending', extractIdx:0 },
  { id:'q5', caseNo:'WA/1120/2024',  desc:'Service Matter — Home Dept',     time:'1d ago', conf:72, confCls:'med',  status:'pending', extractIdx:1 },
];

const VERIFIED_RECORDS = [
  { id:'v1', caseNo:'WP/33901/2023', title:'Krishnamurthy & Ors. vs BDA & State Govt',       dept:'Revenue Department',      actionType:'compliance', actions:['Acquire land per compensation order within 60 days','File compliance report — Deadline: 05 Jan 2024','Notify all affected parties of payment schedule'],         verifiedBy:'S. Patel — Legal Officer',    verifiedOn:'08 Nov 2023', deadline:'Complied',    deadlineCls:'safe',   aiScore:96, critical:false },
  { id:'v2', caseNo:'CRP/5544/2024', title:'Farmers Welfare Assoc. vs PWD & Land Acquisition',dept:'Public Works Department', actionType:'compliance', actions:['Halt land acquisition proceedings pending survey','Conduct joint survey within 21 days','File joint memo before court'],                                          verifiedBy:'R. Kumar — Nodal Officer',    verifiedOn:'15 Feb 2024', deadline:'03 Mar 2024', deadlineCls:'normal', aiScore:91, critical:false },
  { id:'v3', caseNo:'WP/9210/2023',  title:'Teachers Union vs Education Department',          dept:'Education Department',    actionType:'appeal',     actions:['Evaluate grounds for SLP before Supreme Court','Limitation: 90 days from 20 Oct 2023','Coordinate with Advocate General office'],                             verifiedBy:'M. Nair — Secretary',         verifiedOn:'25 Oct 2023', deadline:'18 Jan 2024', deadlineCls:'urgent', aiScore:83, critical:true  },
  { id:'v4', caseNo:'WP/7741/2024',  title:'Environment Watch vs Urban Development Dept',     dept:'Urban Development',       actionType:'compliance', actions:['Submit EIA report to court within 30 days','Halt construction of Zone A pending order','Provide progress report every 15 days'],                            verifiedBy:'S. Patel — Legal Officer',    verifiedOn:'01 Apr 2024', deadline:'01 May 2024', deadlineCls:'urgent', aiScore:88, critical:true  },
  { id:'v5', caseNo:'SLP/4412/2024', title:"Merchants Guild vs Finance Department",           dept:'Finance Department',      actionType:'appeal',     actions:['Assess merits of appeal on tax reassessment order','Engage senior counsel within 7 days','File SLP within 30-day limitation period'],                    verifiedBy:'R. Kumar — Nodal Officer',    verifiedOn:'10 Apr 2024', deadline:'10 May 2024', deadlineCls:'normal', aiScore:79, critical:false },
  { id:'v6', caseNo:'WP/18230/2023', title:'KSRTC vs Labour Tribunal',                        dept:'Transport Department',    actionType:'compliance', actions:['Implement revised pay scale for Grade-III employees','File compliance report within 45 days','Compute and pay all salary arrears'],                          verifiedBy:'A. Iyer — Senior Officer',    verifiedOn:'14 Dec 2023', deadline:'Complied',    deadlineCls:'safe',   aiScore:92, critical:false },
];

const NOTIFICATIONS = [
  { id:'n1', title:'Critical Deadline!',    desc:'WP/22107/2023 — Affidavit due in 3 days', time:'Just now',  icon:'🚨', type:'red',   unread:true  },
  { id:'n2', title:'New Case Added',         desc:'WP/14832/2024 fetched from CIS API',      time:'2h ago',   icon:'📄', type:'blue',  unread:true  },
  { id:'n3', title:'Verification Pending',   desc:'5 cases awaiting your review',            time:'3h ago',   icon:'✅', type:'amber', unread:true  },
  { id:'n4', title:'Appeal Deadline Alert',  desc:'SLP/8901/2024 — Decision needed in 8d',  time:'5h ago',   icon:'⚖️', type:'amber', unread:false },
  { id:'n5', title:'Case Verified',          desc:'CRP/5544/2024 approved by R. Kumar',      time:'1d ago',   icon:'✓',  type:'green', unread:false },
  { id:'n6', title:'CIS API Sync Complete',  desc:'4 new judgments fetched from High Court', time:'2d ago',   icon:'🔗', type:'blue',  unread:false },
];

const MONTHLY_CHART_DATA = [
  { month:'Oct',  received:18, verified:14, pending:4  },
  { month:'Nov',  received:22, verified:17, pending:5  },
  { month:'Dec',  received:16, verified:13, pending:3  },
  { month:'Jan',  received:31, verified:22, pending:9  },
  { month:'Feb',  received:28, verified:20, pending:8  },
  { month:'Mar',  received:35, verified:24, pending:11 },
];

const DEPT_PERF = [
  { name:'Revenue Department', total:72, verified:61, pending:11, rate:85, avgDays:22 },
  { name:'Finance Dept',       total:44, verified:34, pending:10, rate:77, avgDays:31 },
  { name:'Home Department',    total:38, verified:31, pending:7,  rate:82, avgDays:26 },
  { name:'Public Works (PWD)', total:51, verified:44, pending:7,  rate:86, avgDays:19 },
  { name:'Urban Development',  total:29, verified:21, pending:8,  rate:72, avgDays:38 },
  { name:'Other Departments',  total:13, verified:9,  pending:4,  rate:69, avgDays:44 },
];

const RECENT_ACTIVITY = [
  { icon:'✅', bg:'var(--green-100)', text:'Approved WP/33901/2023', time:'2h ago' },
  { icon:'✏️', bg:'var(--amber-100)', text:'Edited extraction — SLP/8901/2024', time:'4h ago' },
  { icon:'✕',  bg:'var(--red-100)',   text:'Rejected WP/7001/2023 — re-upload required', time:'1d ago' },
  { icon:'📥', bg:'var(--navy-100)',  text:'Reviewed WP/22107/2023 for verification', time:'2d ago' },
];

/* ════════════════════════════════════════════════════════════
   2. UTILITIES
════════════════════════════════════════════════════════════ */
function showToast(msg, type = 'info', duration = 3500) {
  const icons = { success:'✓', error:'✕', warning:'⚠', info:'ℹ' };
  const el = document.getElementById('toastContainer');
  if (!el) return;
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `<span class="toast-icon">${icons[type] || 'ℹ'}</span><span>${msg}</span>`;
  el.appendChild(t);
  setTimeout(() => {
    t.style.animation = 'toastIn .3s reverse forwards';
    setTimeout(() => t.remove(), 300);
  }, duration);
}

function animateCount(el) {
  const target = parseInt(el.dataset.count, 10);
  const duration = 1200;
  const start = performance.now();
  const update = (now) => {
    const p = Math.min((now - start) / duration, 1);
    const ease = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(ease * target);
    if (p < 1) requestAnimationFrame(update);
    else el.textContent = target;
  };
  requestAnimationFrame(update);
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = 'none';
}

function closeModalOvl(e, id) {
  if (e.target.classList.contains('modal-overlay')) closeModal(id);
}

function toggleSidebar() {
  const s = document.getElementById('sidebar');
  const o = document.getElementById('sidebarOverlay');
  if (!s) return;
  s.classList.toggle('open');
  if (o) o.classList.toggle('open');
}

function updateClock() {
  const el = document.getElementById('liveClock');
  if (!el) return;
  el.textContent = new Date().toLocaleString('en-IN', {
    day:'2-digit', month:'short', year:'numeric',
    hour:'2-digit', minute:'2-digit'
  });
}

function capitalize(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
}

function formatFileSize(bytes) {
  if (bytes < 1024)    return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}

/* ════════════════════════════════════════════════════════════
   3. PAGE NAVIGATION
════════════════════════════════════════════════════════════ */
function showPage(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const page    = document.getElementById(`page-${name}`);
  const navItem = document.querySelector(`.nav-item[data-page="${name}"]`);
  if (page)    page.classList.add('active');
  if (navItem) navItem.classList.add('active');
  STATE.currentPage = name;
  // Close mobile sidebar
  const s = document.getElementById('sidebar');
  const o = document.getElementById('sidebarOverlay');
  if (s) s.classList.remove('open');
  if (o) o.classList.remove('open');
  // Per-page init
  if (name === 'dashboard')    initDashboard();
  if (name === 'extraction')   initExtraction();
  if (name === 'actionplan')   initActionPlan(0);
  if (name === 'verification') initVerification();
  if (name === 'verified')     initVerifiedRecords();
  if (name === 'reports')      initReports();
  if (name === 'settings')     initSettings();
}

/* ════════════════════════════════════════════════════════════
   4. AUTH — login.html
════════════════════════════════════════════════════════════ */
function switchAuthTab(tab) {
  document.querySelectorAll('.auth-form-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
  if (tab === 'signin') {
    document.getElementById('formSignin')?.classList.add('active');
    document.getElementById('tabSignin')?.classList.add('active');
  } else if (tab === 'signup') {
    document.getElementById('formSignup')?.classList.add('active');
    document.getElementById('tabSignup')?.classList.add('active');
  } else if (tab === 'forgot') {
    document.getElementById('formForgot')?.classList.add('active');
  } else if (tab === 'success') {
    document.getElementById('formSuccess')?.classList.add('active');
  }
}

function handleSignin(e) {
  e.preventDefault();
  const email = document.getElementById('signinEmail').value.trim();
  const pwd   = document.getElementById('signinPassword').value;
  let valid   = true;
  clearErrors(['signinEmailErr','signinPwdErr']);
  if (!email) { showError('signinEmailErr','Email or Employee ID is required'); valid = false; }
  if (!pwd)   { showError('signinPwdErr','Password is required'); valid = false; }
  if (pwd && pwd.length < 6) { showError('signinPwdErr','Minimum 6 characters'); valid = false; }
  if (!valid) return;
  setLoading('signinBtn', true);
  setTimeout(() => {
    setLoading('signinBtn', false);
    const raw  = email.includes('@') ? email.split('@')[0].replace(/[._]/g,' ') : 'S. Patel';
    const name = raw.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    sessionStorage.setItem('ccms_user', JSON.stringify({ name, role:'Legal Officer', email }));
    showToast('Sign in successful! Redirecting...', 'success');
    setTimeout(() => { window.location.href = 'index.html'; }, 1000);
  }, 1800);
}

function handleSignup(e) {
  e.preventDefault();
  const first   = document.getElementById('signupFirst').value.trim();
  const last    = document.getElementById('signupLast').value.trim();
  const email   = document.getElementById('signupEmail').value.trim();
  const empId   = document.getElementById('signupEmpId').value.trim();
  const dept    = document.getElementById('signupDept').value;
  const pwd     = document.getElementById('signupPwd').value;
  const confirm = document.getElementById('signupConfirm').value;
  const agreed  = document.getElementById('agreeTerms').checked;
  let valid = true;
  clearErrors(['signupFirstErr','signupLastErr','signupEmailErr','signupEmpErr','signupDeptErr','signupPwdErr','signupConfirmErr','agreeErr']);
  if (!first)  { showError('signupFirstErr','First name required'); valid = false; }
  if (!last)   { showError('signupLastErr','Last name required');   valid = false; }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showError('signupEmailErr','Valid official email required'); valid = false; }
  if (!empId)  { showError('signupEmpErr','Employee ID required'); valid = false; }
  if (!dept)   { showError('signupDeptErr','Please select your department'); valid = false; }
  if (!pwd || pwd.length < 8) { showError('signupPwdErr','Minimum 8 characters'); valid = false; }
  if (pwd !== confirm)        { showError('signupConfirmErr','Passwords do not match'); valid = false; }
  if (!agreed) { showError('agreeErr','You must agree to the Terms of Use'); valid = false; }
  if (!valid) return;
  setLoading('signupBtn', true);
  setTimeout(() => {
    setLoading('signupBtn', false);
    document.getElementById('successTitle').textContent = 'Account Request Submitted!';
    document.getElementById('successDesc').textContent  = `Your request has been submitted for admin approval. You will receive an email at ${email} once access is activated.`;
    document.getElementById('successInfo').innerHTML    = `<strong>Name:</strong> ${first} ${last}<br/><strong>Employee ID:</strong> ${empId}<br/><strong>Department:</strong> ${dept}<br/><strong>Status:</strong> Pending Admin Approval`;
    switchAuthTab('success');
  }, 2000);
}

function handleForgot(e) {
  e.preventDefault();
  const email = document.getElementById('forgotEmail').value.trim();
  clearErrors(['forgotEmailErr']);
  if (!email) { showError('forgotEmailErr','Email or Employee ID is required'); return; }
  const otpSection = document.getElementById('otpSection');
  if (!otpSection || otpSection.style.display === 'none' || !otpSection.style.display) {
    setLoading('forgotBtn', true);
    setTimeout(() => {
      setLoading('forgotBtn', false);
      if (otpSection) otpSection.style.display = 'block';
      const btnText = document.querySelector('#forgotBtn .btn-text');
      if (btnText) btnText.textContent = 'Verify OTP & Reset Password';
      showToast('OTP sent to your registered email', 'success');
    }, 1500);
  } else {
    const boxes = document.querySelectorAll('.otp-box');
    const otp   = Array.from(boxes).map(b => b.value).join('');
    if (otp.length < 6) { showToast('Please enter all 6 OTP digits', 'error'); return; }
    setLoading('forgotBtn', true);
    setTimeout(() => {
      setLoading('forgotBtn', false);
      document.getElementById('successTitle').textContent = 'Password Reset Successful!';
      document.getElementById('successDesc').textContent  = 'Your password has been reset. You can now sign in with your new credentials.';
      if (document.getElementById('successInfo')) document.getElementById('successInfo').textContent = '';
      switchAuthTab('success');
    }, 1500);
  }
}

function otpMove(el, idx) {
  el.value = el.value.replace(/\D/g,'');
  if (el.value) {
    const boxes = document.querySelectorAll('.otp-box');
    if (idx < 6 && boxes[idx]) boxes[idx].focus();
  }
}

function checkPwdStrength(pwd) {
  const bar   = document.getElementById('pwdStrength');
  const label = document.getElementById('pwdLabel');
  const bars  = document.querySelectorAll('.pwd-bar');
  if (!bar) return;
  bar.style.display = pwd.length ? 'flex' : 'none';
  bars.forEach(b => b.className = 'pwd-bar');
  let score = 0;
  if (pwd.length >= 8)        score++;
  if (/[A-Z]/.test(pwd))      score++;
  if (/[0-9]/.test(pwd))      score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  const cls    = ['','active-weak','active-fair','active-good','active-strong'];
  const labels = ['','Weak','Fair','Good','Strong'];
  const colors = ['','#ef4444','#f59e0b','#3b7fbe','#22c55e'];
  for (let i = 0; i < score; i++) { if (bars[i]) bars[i].classList.add(cls[score]); }
  if (label) { label.textContent = labels[score] || 'Weak'; label.style.color = colors[score]; }
}

function togglePwd(inputId, btn) {
  const inp = document.getElementById(inputId);
  if (!inp) return;
  inp.type = inp.type === 'password' ? 'text' : 'password';
  if (btn) btn.querySelector('svg').style.opacity = inp.type === 'text' ? '0.5' : '1';
}

function showError(id, msg) {
  const el = document.getElementById(id);
  if (el) el.textContent = msg;
  const inputId = id.replace('Err','');
  const inp = document.getElementById(inputId);
  if (inp) inp.classList.add('error');
}

function clearErrors(ids) {
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = '';
    const inp = document.getElementById(id.replace('Err',''));
    if (inp) inp.classList.remove('error');
  });
}

function setLoading(btnId, loading) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  const text   = btn.querySelector('.btn-text');
  const loader = btn.querySelector('.btn-loader');
  const arrow  = btn.querySelector('.btn-arrow');
  btn.disabled = loading;
  if (text)   text.style.display   = loading ? 'none' : '';
  if (loader) loader.style.display = loading ? 'inline-flex' : 'none';
  if (arrow)  arrow.style.display  = loading ? 'none' : '';
}

/* ════════════════════════════════════════════════════════════
   5. USER SESSION / LOGOUT
════════════════════════════════════════════════════════════ */
function loadUserIntoSidebar() {
  try {
    const u = JSON.parse(sessionStorage.getItem('ccms_user') || '{}');
    if (!u.name) return;
    STATE.currentUser = u;
    const initials = u.name.split(' ').map(w => w[0]).join('').substring(0,2).toUpperCase();
    const nm = document.getElementById('sidebarName');
    const rl = document.getElementById('sidebarRole');
    const av = document.getElementById('sidebarAvatar');
    if (nm) nm.textContent = u.name;
    if (rl) rl.textContent = u.role || 'Legal Officer';
    if (av) av.textContent = initials;
  } catch(e) {}
}

function handleLogout() {
  if (!confirm('Are you sure you want to sign out?')) return;
  sessionStorage.removeItem('ccms_user');
  showToast('Signed out successfully', 'success');
  setTimeout(() => { window.location.href = 'login.html'; }, 900);
}

/* ════════════════════════════════════════════════════════════
   6. DASHBOARD
════════════════════════════════════════════════════════════ */
function initDashboard() {
  renderCasesTable(CASES);
  renderDeadlines();
  renderDeptBars();
  document.querySelectorAll('.stat-value[data-count]').forEach(el => animateCount(el));
}

function renderCasesTable(cases) {
  const tbody = document.getElementById('casesTableBody');
  if (!tbody) return;
  tbody.innerHTML = cases.map(c => `
    <tr>
      <td><span class="case-no">${c.caseNo}</span></td>
      <td style="font-size:.78rem;color:var(--slate-600)">${c.date}</td>
      <td style="font-size:.82rem;font-weight:500">${c.dept}</td>
      <td><span style="font-size:.76rem;color:var(--slate-500)">${c.nature}</span></td>
      <td><span class="status-pill st-${c.status}">${capitalize(c.status)}</span></td>
      <td><span class="ai-score ${c.score_class}">${c.aiScore}%</span></td>
      <td>
        <button class="tbl-action-btn" onclick="handleCaseAction(${c.id})">
          ${c.status === 'pending' || c.status === 'extracted' || c.status === 'critical' ? 'Review' : 'View'}
        </button>
      </td>
    </tr>
  `).join('');
}

function handleCaseAction(id) {
  const c = CASES.find(x => x.id === id);
  if (!c) return;
  if (c.status === 'pending' || c.status === 'extracted' || c.status === 'critical') {
    showPage('verification');
  } else {
    showPage('verified');
  }
}

function filterCasesTable(dept) {
  const filtered = dept ? CASES.filter(c => c.dept.toLowerCase().includes(dept.toLowerCase())) : CASES;
  renderCasesTable(filtered);
}

function renderDeadlines() {
  const el = document.getElementById('deadlineList');
  if (!el) return;
  el.innerHTML = DEADLINES.map(d => `
    <div class="deadline-item" onclick="showPage('verification')">
      <div class="dl-bar ${d.urgency}"></div>
      <div class="dl-info">
        <div class="dl-case">${d.caseNo}</div>
        <div class="dl-desc">${d.desc}</div>
      </div>
      <div class="dl-days ${d.urgency}">${d.daysLeft}d</div>
    </div>
  `).join('');
}

function renderDeptBars() {
  const el = document.getElementById('deptBars');
  if (!el) return;
  el.innerHTML = DEPT_DIST.map(d => `
    <div class="dept-bar-row">
      <div class="dept-bar-meta">
        <span class="dept-bar-name">${d.name}</span>
        <span class="dept-bar-count">${d.count}</span>
      </div>
      <div class="dept-bar-track">
        <div class="dept-bar-fill" data-pct="${d.pct}" style="width:0%"></div>
      </div>
    </div>
  `).join('');
  requestAnimationFrame(() => {
    el.querySelectorAll('.dept-bar-fill').forEach(b => { b.style.width = b.dataset.pct + '%'; });
  });
}

/* ════════════════════════════════════════════════════════════
   7. UPLOAD PIPELINE
════════════════════════════════════════════════════════════ */
function handleDragOver(e) {
  e.preventDefault();
  document.getElementById('dropzone')?.classList.add('drag-over');
}
function handleDragLeave() {
  document.getElementById('dropzone')?.classList.remove('drag-over');
}
function handleDrop(e) {
  e.preventDefault();
  document.getElementById('dropzone')?.classList.remove('drag-over');
  const file = e.dataTransfer?.files[0];
  if (file) startUpload(file);
}
function handleFileSelect(e) {
  const file = e.target?.files[0];
  if (file) startUpload(file);
}

function startUpload(file) {
  if (!file.name.toLowerCase().endsWith('.pdf')) {
    showToast('Only PDF files are accepted', 'error'); return;
  }
  const card = document.getElementById('uploadProgressCard');
  const dz   = document.getElementById('dropzone');
  if (dz)   dz.style.display = 'none';
  if (card) card.style.display = 'block';
  const fn = document.getElementById('uploadFileName');
  const fm = document.getElementById('uploadFileMeta');
  if (fn) fn.textContent = file.name;
  if (fm) fm.textContent = formatFileSize(file.size) + ' · Processing...';

  const steps  = ['step-upload','step-ocr','step-parse','step-ai','step-queue'];
  const statIds= ['ss-upload','ss-ocr','ss-parse','ss-ai','ss-queue'];
  const starts = [0, 900, 2000, 3400, 5000];
  const ends   = [900, 2000, 3400, 5000, 6200];

  steps.forEach((sid, i) => {
    setTimeout(() => {
      const el = document.getElementById(sid);
      if (!el) return;
      steps.forEach(s => document.getElementById(s)?.classList.remove('active'));
      el.classList.add('active');
    }, starts[i]);
    setTimeout(() => {
      const el  = document.getElementById(sid);
      const ss  = document.getElementById(statIds[i]);
      if (el) { el.classList.remove('active'); el.classList.add('done'); }
      if (ss) { ss.textContent = '✓ Done'; ss.style.color = 'var(--green-600)'; }
    }, ends[i]);
  });

  setTimeout(() => {
    const uc = document.getElementById('uploadComplete');
    if (uc) uc.style.display = 'block';
    if (fm) fm.textContent = formatFileSize(file.size) + ' · Completed';
    showToast('Document processed and queued for verification', 'success');
    const badge = document.getElementById('verificationBadge');
    if (badge) badge.textContent = parseInt(badge.textContent || '5') + 1;
  }, 6600);
}

function cancelUpload() {
  const card = document.getElementById('uploadProgressCard');
  const dz   = document.getElementById('dropzone');
  const uc   = document.getElementById('uploadComplete');
  if (card) card.style.display = 'none';
  if (dz)   dz.style.display = 'block';
  if (uc)   uc.style.display = 'none';
  ['step-upload','step-ocr','step-parse','step-ai','step-queue'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.remove('active','done');
  });
  ['ss-upload','ss-ocr','ss-parse','ss-ai','ss-queue'].forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.textContent = ''; el.style.color = ''; }
  });
  const fi = document.getElementById('fileInput');
  if (fi) fi.value = '';
}

/* ════════════════════════════════════════════════════════════
   8. EXTRACTION VIEW
════════════════════════════════════════════════════════════ */
function initExtraction() {
  const sel = document.getElementById('caseSelector');
  loadCaseExtraction(sel ? parseInt(sel.value, 10) : 0);
}

function loadCaseExtraction(idx) {
  idx = parseInt(idx, 10);
  const d = EXTRACTION_DATA[idx] || EXTRACTION_DATA[0];
  renderPDFPreview(d);
  renderExtractionFields(d);
}

function renderPDFPreview(d) {
  const viewer = document.getElementById('pdfViewer');
  if (!viewer) return;
  const c = CASES.find(x => x.caseNo === d.caseNo) || CASES[0];
  viewer.innerHTML = `
    <div class="pdf-page">
      <div class="pdf-court-hdr">
        <div class="pdf-court-name">IN THE HIGH COURT OF JUDICATURE</div>
        <div class="pdf-court-sub">ORIGINAL JURISDICTION</div>
        <div class="pdf-case-ref">${d.caseNo}</div>
      </div>
      <div style="display:flex;flex-direction:column;gap:6px;line-height:1.7">
        <div><span class="hl hl-y">Between:</span></div>
        <div><span class="hl hl-b">${c.petitioner}</span> &nbsp;...Petitioner</div>
        <div style="padding-left:14px">vs.</div>
        <div><span class="hl hl-b">${c.respondent}</span> &nbsp;...Respondents</div>
        <div class="pdf-divider"></div>
        <div class="pdf-bold">ORDER</div>
        <div style="color:var(--slate-600)">Heard the learned counsel for both parties. After careful consideration of all pleadings on record, the Court hereby directs as follows:</div>
        ${d.directions.map((dir, i) => `
          <div class="${dir.type === 'critical' ? 'hl hl-g' : dir.type === 'important' ? 'hl hl-o' : ''}" style="display:block;padding:3px 6px;border-radius:3px;margin:1px 0">
            ${i + 1}. ${dir.text}
          </div>
        `).join('')}
        <div class="pdf-faint" style="margin-top:8px">The petition is accordingly disposed of.</div>
        <div><span class="hl hl-y" style="font-size:.74rem">${c.orderDate}</span></div>
        <div class="pdf-faint" style="font-size:.74rem">${d.details.find(x => x.label === 'Bench')?.value || ''}</div>
      </div>
      <div class="pdf-legend">
        <span class="pdf-leg-item"><span class="pdf-leg-dot" style="background:#fef9c3;border:1px solid #fcd34d"></span>Case Details</span>
        <span class="pdf-leg-item"><span class="pdf-leg-dot" style="background:#dbeafe;border:1px solid #93c5fd"></span>Parties</span>
        <span class="pdf-leg-item"><span class="pdf-leg-dot" style="background:#dcfce7;border:1px solid #86efac"></span>Critical Order</span>
        <span class="pdf-leg-item"><span class="pdf-leg-dot" style="background:#ffedd5;border:1px solid #fca5a5"></span>Important</span>
      </div>
    </div>
  `;
}

function renderExtractionFields(d) {
  const container = document.getElementById('extractionFields');
  if (!container) return;
  const confCls = d.confidence >= 90 ? 'high' : d.confidence >= 75 ? 'med' : 'low';
  container.innerHTML = `
    <div class="card">
      <div class="ext-card-hdr">
        <div class="ext-icon blue"><svg viewBox="0 0 16 16" fill="currentColor"><path d="M14 1a1 1 0 011 1v12a1 1 0 01-1 1H2a1 1 0 01-1-1V2a1 1 0 011-1h12z"/></svg></div>
        <h3>Case Details</h3>
        <span class="conf-badge high">${d.confidence}% confident</span>
      </div>
      <div class="field-grid">
        ${d.details.map(f => `
          <div class="field-item" onclick="openFieldEdit('${esc(f.label)}','${esc(f.value)}')">
            <div class="fld-label">${f.label}</div>
            <div class="fld-value">${f.value}</div>
          </div>
        `).join('')}
      </div>
    </div>

    <div class="card">
      <div class="ext-card-hdr">
        <div class="ext-icon purple"><svg viewBox="0 0 16 16" fill="currentColor"><path d="M7 14s-1 0-1-1 1-4 5-4 5 3 5 4-1 1-1 1H7zm4-6a3 3 0 100-6 3 3 0 000 6z"/></svg></div>
        <h3>Parties Involved</h3>
        <span class="conf-badge high">96% confident</span>
      </div>
      <div class="parties-grid">
        ${d.parties.map(p => `
          <div class="party-card">
            <div class="party-role">${p.role}</div>
            <div class="party-name">${p.name}</div>
            <span class="party-tag">${p.tag}</span>
          </div>
        `).join('')}
      </div>
    </div>

    <div class="card">
      <div class="ext-card-hdr">
        <div class="ext-icon amber"><svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 15A7 7 0 118 1a7 7 0 010 14zm0 1A8 8 0 108 0a8 8 0 000 16z"/><path d="M7.002 11a1 1 0 112 0 1 1 0 01-2 0zM7.1 4.995a.905.905 0 111.8 0l-.35 3.507a.552.552 0 01-1.1 0L7.1 4.995z"/></svg></div>
        <h3>Key Directions / Orders</h3>
        <span class="conf-badge ${confCls}">89% confident</span>
      </div>
      <div class="dirs-list">
        ${d.directions.map((dir, i) => `
          <div class="dir-item ${dir.type}">
            <span class="dir-num">${i + 1}.</span>
            <span class="dir-text">${dir.text}</span>
            <span class="dir-tag ${dir.type}">${dir.tag}</span>
          </div>
        `).join('')}
      </div>
    </div>

    <div class="card">
      <div class="ext-card-hdr">
        <div class="ext-icon red"><svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 3.5a.5.5 0 00-1 0V9a.5.5 0 00.252.434l3.5 2a.5.5 0 00.496-.868L8 8.71V3.5z"/><path d="M8 16A8 8 0 108 0a8 8 0 000 16z"/></svg></div>
        <h3>Timelines &amp; Deadlines</h3>
        <span class="conf-badge med">84% confident</span>
      </div>
      <div class="tl-list">
        ${d.timelines.map(t => `
          <div class="tl-item">
            <div class="tl-icon ${t.urgency}">${t.urgency === 'red' ? '🔴' : t.urgency === 'amber' ? '🟡' : '🔵'}</div>
            <div class="tl-body">
              <div class="tl-event">${t.event}</div>
              <div class="tl-date">${t.date}</div>
            </div>
            <span class="tl-days ${t.urgency}">${t.daysLeft}</span>
          </div>
        `).join('')}
      </div>
    </div>

    <div class="ext-actions">
      <button class="btn btn-outline" onclick="showPage('verification')">
        <svg viewBox="0 0 16 16" fill="currentColor"><path d="M15.854.146a.5.5 0 01.11.54l-5.819 14.547a.75.75 0 01-1.329.124l-3.178-4.995L.643 7.184a.75.75 0 01.124-1.33L15.314.037a.5.5 0 01.54.11z"/></svg>
        Send to Verification
      </button>
      <button class="btn btn-primary" onclick="showPage('actionplan')">View AI Action Plan →</button>
    </div>
  `;
}

function zoomPDF(dir) {
  STATE.pdfZoom = Math.min(1.5, Math.max(0.7, STATE.pdfZoom + dir * 0.1));
  const viewer = document.getElementById('pdfViewer');
  if (viewer) viewer.style.fontSize = (STATE.pdfZoom * 100) + '%';
}

function esc(s) { return (s || '').replace(/'/g,"\\'"); }

/* ════════════════════════════════════════════════════════════
   9. ACTION PLAN
════════════════════════════════════════════════════════════ */
function initActionPlan(idx) {
  idx = parseInt(idx || 0, 10);
  loadActionPlanForCase(idx);
}

function loadActionPlanForCase(idx) {
  idx = parseInt(idx, 10);
  const ap = ACTION_PLANS[idx] || ACTION_PLANS[0];
  const el = document.getElementById('actionplanContent');
  if (!el) return;

  el.innerHTML = `
    <div class="decision-banner">
      <div class="decision-inner">
        <div class="dec-emoji">${ap.emoji}</div>
        <div class="dec-text">
          <div class="dec-label">AI Recommendation</div>
          <div class="dec-value">${ap.recommendation}</div>
          <div class="dec-reason">${ap.reason}</div>
        </div>
        <div style="text-align:center">
          <div class="conf-ring">
            <svg viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#334155" stroke-width="3"/>
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#22c55e" stroke-width="3"
                stroke-dasharray="${ap.confidence} 100" stroke-dashoffset="25" stroke-linecap="round"/>
            </svg>
            <span>${ap.confidence}%</span>
          </div>
          <div class="conf-ring-lbl">AI Confidence</div>
        </div>
      </div>
    </div>

    <div class="ap-grid">
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">Required Actions</h2>
          <span class="badge badge-blue">${ap.actions.length} items</span>
        </div>
        <div class="action-items-list">
          ${ap.actions.map(a => `
            <div class="action-item ${a.priority}">
              <div class="ai-item-icon" style="background:${a.bg}">${a.icon}</div>
              <div class="ai-item-body">
                <div class="ai-item-title">${a.title}</div>
                <div class="ai-item-desc">${a.desc}</div>
                <div class="ai-item-tags">${a.tags.map(t => `<span class="ai-item-tag">${t}</span>`).join('')}</div>
              </div>
              <div class="ai-item-priority">${a.priority.toUpperCase()}</div>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="card">
        <div class="card-header"><h2 class="card-title">Compliance Timeline</h2></div>
        <div class="roadmap-list">
          ${ap.timeline.map((step, i) => `
            <div class="rm-step ${step.state}">
              <div class="rm-dot-col">
                <div class="rm-dot">${step.state === 'done' ? '✓' : i + 1}</div>
                ${i < ap.timeline.length - 1 ? '<div style="width:2px;height:18px;background:var(--slate-200);margin:0 auto;"></div>' : ''}
              </div>
              <div class="rm-body">
                <div class="rm-day">${step.day}</div>
                <div class="rm-title">${step.title}</div>
                <div class="rm-desc">${step.desc}</div>
                <span class="rm-date">${step.date}</span>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="card">
        <div class="card-header"><h2 class="card-title">Responsible Departments</h2></div>
        <div class="dept-resp-list">
          ${ap.departments.map(d => `
            <div class="dept-resp-item">
              <div class="dr-av">${d.abbr}</div>
              <div class="dr-info">
                <div class="dr-name">${d.name}</div>
                <div class="dr-role">${d.role}</div>
              </div>
              <span class="dr-badge ${d.badge}">${d.badge === 'primary' ? 'Primary' : 'Support'}</span>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="card">
        <div class="card-header"><h2 class="card-title">Risk Assessment</h2></div>
        <div class="risk-grid">
          ${ap.risks.map(r => `
            <div class="risk-item ${r.cls}">
              <div class="risk-level">${r.level}</div>
              <div class="risk-title">${r.title}</div>
              <div class="risk-desc">${r.desc}</div>
              <div class="risk-meter"><div class="risk-fill"></div></div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;

  // Sync AP case selector
  const apSel = document.getElementById('apCaseSelector');
  if (apSel) apSel.value = idx;
}

function exportReport() {
  showToast('Generating PDF report — please wait...', 'info', 2000);
  setTimeout(() => showToast('Report downloaded: ActionPlan_Report.pdf', 'success'), 2300);
}

/* ════════════════════════════════════════════════════════════
   10. VERIFICATION QUEUE
════════════════════════════════════════════════════════════ */
function initVerification() {
  if (!STATE.verificationQueue || STATE.verificationQueue.length === 0) {
    STATE.verificationQueue = QUEUE_ITEMS.map(q => ({ ...q }));
  }
  renderQueue();
  updateQueueCounters();
}

function renderQueue() {
  const container = document.getElementById('verificationQueue');
  if (!container) return;
  const items = STATE.verificationQueue;
  const pendingCount = items.filter(i => i.status === 'pending').length;
  container.innerHTML = `
    <div class="ver-queue-head">
      <span>REVIEW QUEUE</span>
      <span id="queueCount">${pendingCount} pending</span>
    </div>
    ${items.map(item => `
      <div class="q-item ${item.status} ${STATE.selectedQueueItem === item.id ? 'selected' : ''}"
           onclick="selectQueueItem('${item.id}')">
        <div class="q-item-top">
          <span class="q-case-no">${item.caseNo}</span>
          <span class="q-dot"></span>
        </div>
        <div class="q-desc">${item.desc}</div>
        <div class="q-bottom">
          <span class="q-time">${item.time}</span>
          <span class="q-conf ${item.confCls}">${item.conf}% confidence</span>
        </div>
        ${item.status !== 'pending' ? `
          <div style="font-size:.7rem;font-weight:700;margin-top:4px;
            color:${item.status === 'approved' ? 'var(--green-600)' : 'var(--red-500)'}">
            ${item.status === 'approved' ? '✓ Approved' : '✕ Rejected'}
          </div>` : ''}
      </div>
    `).join('')}
  `;
}

function selectQueueItem(id) {
  STATE.selectedQueueItem = id;
  renderQueue();
  const item = STATE.verificationQueue.find(i => i.id === id);
  if (!item) return;
  const data = EXTRACTION_DATA[item.extractIdx] || EXTRACTION_DATA[0];
  renderReviewPanel(item, data);
}

function renderReviewPanel(item, data) {
  const panel = document.getElementById('reviewPanel');
  if (!panel) return;
  const confCls = item.conf >= 90 ? 'high' : item.conf >= 75 ? 'med' : 'low';
  const isActioned = item.status !== 'pending';

  panel.innerHTML = `
    <div class="review-panel-hdr">
      <h3>${item.caseNo}</h3>
      <span class="conf-badge ${confCls}">${item.conf}% AI confidence</span>
    </div>
    <div class="review-body">
      <div class="review-section">
        <div class="review-section-title">Case Information</div>
        ${buildRevField('Case Number',   data.caseNo)}
        ${buildRevField('Court',         data.details.find(d => d.label === 'Court')?.value || '')}
        ${buildRevField('Date of Order', data.details.find(d => d.label === 'Date of Order')?.value || '')}
        ${buildRevField('Case Type',     data.details.find(d => d.label === 'Case Type')?.value || '')}
        ${buildRevField('Disposal',      data.details.find(d => d.label === 'Disposal')?.value || '')}
      </div>
      <div class="review-section">
        <div class="review-section-title">Parties (${data.parties.length})</div>
        ${data.parties.map(p => buildRevField(p.role, p.name)).join('')}
      </div>
      <div class="review-section">
        <div class="review-section-title">Key Directions (${data.directions.length})</div>
        ${data.directions.map((d, i) => buildRevField(`Order ${i + 1}`, d.text)).join('')}
      </div>
      <div class="review-section">
        <div class="review-section-title">Timelines</div>
        ${data.timelines.map(t => buildRevField(t.event, t.date + ' · ' + t.daysLeft)).join('')}
      </div>
    </div>
    ${!isActioned ? `
    <div class="review-actions-row">
      <button class="btn btn-danger" onclick="verifyAction('${item.id}','reject')">
        <svg viewBox="0 0 16 16" fill="currentColor"><path d="M4.646 4.646a.5.5 0 01.708 0L8 7.293l2.646-2.647a.5.5 0 01.708.708L8.707 8l2.647 2.646a.5.5 0 01-.708.708L8 8.707l-2.646 2.647a.5.5 0 01-.708-.708L7.293 8 4.646 5.354a.5.5 0 010-.708z"/></svg>
        Reject
      </button>
      <button class="btn btn-outline" onclick="showToast('Click any field above to edit it inline','info')">
        <svg viewBox="0 0 16 16" fill="currentColor"><path d="M12.854.146a.5.5 0 00-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 000-.708l-3-3z"/><path d="M1 13.5A1.5 1.5 0 002.5 15H11a.5.5 0 000-1H2.5a.5.5 0 01-.5-.5v-10a.5.5 0 01.5-.5H6a.5.5 0 000-1H2.5A1.5 1.5 0 001 4.5v9z"/></svg>
        Edit Fields
      </button>
      <button class="btn btn-success" onclick="verifyAction('${item.id}','approve')">
        <svg viewBox="0 0 16 16" fill="currentColor"><path d="M13.854 3.646a.5.5 0 010 .708l-7 7a.5.5 0 01-.708 0l-3.5-3.5a.5.5 0 11.708-.708L6.5 10.293l6.646-6.647a.5.5 0 01.708 0z"/></svg>
        Approve &amp; Verify
      </button>
    </div>
    ` : `
    <div style="padding:14px 18px;border-top:1px solid var(--slate-100);text-align:center">
      <span style="font-size:.84rem;font-weight:600;
        color:${item.status === 'approved' ? 'var(--green-600)' : 'var(--red-500)'}">
        ${item.status === 'approved' ? '✓ This record has been Approved & Verified' : '✕ This record has been Rejected — re-upload required'}
      </span>
    </div>
    `}
  `;
}

function buildRevField(label, value) {
  return `
    <div class="rev-field" onclick="openFieldEdit('${esc(label)}','${esc(value)}')">
      <div class="rev-field-lbl">${label}</div>
      <div class="rev-field-val">${value}</div>
      <div class="rev-field-edit">Edit ✏</div>
    </div>
  `;
}

function verifyAction(itemId, action) {
  const item = STATE.verificationQueue.find(i => i.id === itemId);
  if (!item) return;

  if (action === 'approve') {
    item.status = 'approved';
    STATE.approvedCount++;
    showToast(`${item.caseNo} approved & moved to verified records`, 'success');
    // Push to verified records
    const c = CASES.find(x => x.caseNo === item.caseNo);
    if (c) {
      const u = STATE.currentUser || { name: 'S. Patel' };
      VERIFIED_RECORDS.unshift({
        id: 'v_' + item.id,
        caseNo: item.caseNo,
        title: `${c.petitioner} vs ${c.respondent}`,
        dept: c.dept + ' Department',
        actionType: c.actionType,
        actions: ['Comply with court directions as specified in order', 'File compliance report to court within prescribed time', 'Notify all concerned officers and departments'],
        verifiedBy: `${u.name} — ${u.role || 'Legal Officer'}`,
        verifiedOn: new Date().toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}),
        deadline: '30 days', deadlineCls: 'normal', aiScore: item.conf, critical: item.conf < 80,
      });
    }
  } else {
    item.status = 'rejected';
    showToast(`${item.caseNo} rejected — flagged for re-extraction`, 'warning');
  }

  updateQueueCounters();
  renderQueue();
  const data = EXTRACTION_DATA[item.extractIdx] || EXTRACTION_DATA[0];
  renderReviewPanel(item, data);
}

function updateQueueCounters() {
  const pending  = STATE.verificationQueue.filter(i => i.status === 'pending').length;
  const approved = STATE.verificationQueue.filter(i => i.status === 'approved').length;
  const pEl = document.getElementById('qcPending');
  const aEl = document.getElementById('qcApproved');
  const badge = document.getElementById('verificationBadge');
  if (pEl) pEl.textContent = pending;
  if (aEl) aEl.textContent = approved;
  if (badge) badge.textContent = pending;
}

function goToVerification() {
  closeModal('caseDetailModal');
  showPage('verification');
}

/* ════════════════════════════════════════════════════════════
   11. VERIFIED RECORDS
════════════════════════════════════════════════════════════ */
function initVerifiedRecords() {
  renderVerifiedGrid(VERIFIED_RECORDS);
}

function renderVerifiedGrid(records) {
  const grid = document.getElementById('verifiedGrid');
  if (!grid) return;
  if (!records.length) {
    grid.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:60px 20px;color:var(--slate-400)">
        <div style="font-size:3rem;margin-bottom:12px">📋</div>
        <div style="font-size:1rem;font-weight:600;color:var(--slate-600)">No verified records found</div>
        <div style="font-size:.84rem;margin-top:6px">Approve cases in the Verification queue to see them here</div>
        <button class="btn btn-primary" style="margin:18px auto 0" onclick="showPage('verification')">Go to Verification Queue</button>
      </div>`;
    return;
  }
  grid.innerHTML = records.map(r => `
    <div class="v-card" onclick="openVerifiedCase('${r.id}')">
      <div class="v-card-top">
        <div class="v-card-meta">
          <span class="v-case-no">${r.caseNo}</span>
          <span class="v-stamp">
            <svg viewBox="0 0 10 10" fill="currentColor"><path d="M8.5 2L4 7 1.5 4.5 0 6l4 4 6-8z"/></svg>
            Verified
          </span>
        </div>
        <div class="v-title">${r.title}</div>
        <div class="v-dept">${r.dept}</div>
      </div>
      <div class="v-card-body">
        ${r.actions.map((a, i) => `
          <div class="v-action-row">
            <span class="v-bullet ${['c','a','d'][i % 3]}">${['C','A','D'][i % 3]}</span>
            <span>${a}</span>
          </div>
        `).join('')}
      </div>
      <div class="v-card-foot">
        <span class="v-date">Verified: ${r.verifiedOn} · AI ${r.aiScore}%</span>
        <span class="v-deadline ${r.deadlineCls}">${r.critical ? '🔴 ' : ''}${r.deadline}</span>
      </div>
    </div>
  `).join('');
}

function filterVerifiedRecords(query) {
  const q = (query || '').toLowerCase();
  const filtered = VERIFIED_RECORDS.filter(r =>
    r.caseNo.toLowerCase().includes(q) ||
    r.title.toLowerCase().includes(q)  ||
    r.dept.toLowerCase().includes(q)
  );
  applyVerifiedFilter(filtered);
}

function setVerifiedFilter(btn, filter) {
  document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  STATE.verifiedFilter = filter;
  applyVerifiedFilter(VERIFIED_RECORDS);
}

function applyVerifiedFilter(records) {
  const f = STATE.verifiedFilter;
  const filtered = f === 'compliance' ? records.filter(r => r.actionType === 'compliance')
                 : f === 'appeal'     ? records.filter(r => r.actionType === 'appeal')
                 : f === 'critical'   ? records.filter(r => r.critical)
                 : records;
  renderVerifiedGrid(filtered);
}

function openVerifiedCase(id) {
  const r = VERIFIED_RECORDS.find(x => x.id === id);
  if (!r) return;
  const apIdx = ACTION_PLANS.findIndex(ap => ap.caseNo === r.caseNo);
  if (apIdx >= 0) {
    showPage('actionplan');
    setTimeout(() => loadActionPlanForCase(apIdx), 80);
  } else {
    showPage('actionplan');
  }
}

/* ════════════════════════════════════════════════════════════
   12. REPORTS
════════════════════════════════════════════════════════════ */
function initReports() {
  renderReportStats();
  renderMonthlyChart();
  renderOutcomeDonut();
  renderDeptPerfTable();
  renderActionsRequired();
}

function renderReportStats() {
  const grid = document.getElementById('reportStatsGrid');
  if (!grid) return;
  const stats = [
    { color:'blue',  label:'Total Cases This Period',  count:150, delta:'+18 vs prev period',  deltaClass:'positive' },
    { color:'green', label:'Successfully Complied',    count:103, delta:'68.7% compliance',     deltaClass:'positive' },
    { color:'amber', label:'Appeals Filed',            count:31,  delta:'20.7% of total',       deltaClass:'urgent'   },
    { color:'red',   label:'Missed Deadlines',         count:16,  delta:'↑ 4 vs prev period',  deltaClass:'negative' },
  ];
  grid.innerHTML = stats.map(s => `
    <div class="stat-card" data-color="${s.color}">
      <div class="stat-content">
        <div class="stat-value" data-count="${s.count}">${s.count}</div>
        <div class="stat-label">${s.label}</div>
        <div class="stat-delta ${s.deltaClass}">${s.delta}</div>
      </div>
    </div>
  `).join('');
}

function renderMonthlyChart() {
  const wrap = document.getElementById('monthlyChart');
  if (!wrap) return;
  const maxVal = Math.max(...MONTHLY_CHART_DATA.map(d => d.received));
  wrap.innerHTML = `
    <div class="bar-chart">
      ${MONTHLY_CHART_DATA.map(d => `
        <div class="bar-group">
          <div class="bar-group-bars">
            <div class="bar-col received" style="height:${(d.received/maxVal*130).toFixed(0)}px" title="Received: ${d.received}"></div>
            <div class="bar-col verified" style="height:${(d.verified/maxVal*130).toFixed(0)}px" title="Verified: ${d.verified}"></div>
            <div class="bar-col pending" style="height:${(d.pending/maxVal*130).toFixed(0)}px" title="Pending: ${d.pending}"></div>
          </div>
          <div class="bar-month">${d.month}</div>
        </div>
      `).join('')}
    </div>
  `;
}

function renderOutcomeDonut() {
  const wrap = document.getElementById('outcomeDonut');
  if (!wrap) return;
  const segments = [
    { label:'Complied',     pct:69, color:'#22c55e' },
    { label:'Appeal Filed', pct:21, color:'#f59e0b' },
    { label:'Pending',      pct:10, color:'#3b7fbe'  },
  ];
  let offset = 25;
  const circles = segments.map(s => {
    const dash = `${s.pct} 100`;
    const el = `<circle cx="18" cy="18" r="15.9" fill="none" stroke="${s.color}" stroke-width="4"
      stroke-dasharray="${dash}" stroke-dashoffset="${offset}" stroke-linecap="round"/>`;
    offset -= s.pct;
    return el;
  }).join('');
  wrap.innerHTML = `
    <div class="donut-svg" style="position:relative;width:140px;height:140px">
      <svg viewBox="0 0 36 36" style="width:140px;height:140px;transform:rotate(-90deg)">
        <circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--slate-100)" stroke-width="4"/>
        ${circles}
      </svg>
      <div class="donut-center">
        <div class="donut-center-val">76%</div>
        <div class="donut-center-lbl">Compliance</div>
      </div>
    </div>
    <div class="donut-legend">
      ${segments.map(s => `
        <div class="donut-leg-item">
          <span class="donut-leg-label"><span class="donut-leg-dot" style="background:${s.color}"></span>${s.label}</span>
          <span class="donut-leg-val">${s.pct}%</span>
        </div>
      `).join('')}
    </div>
  `;
}

function renderDeptPerfTable() {
  const tbody = document.getElementById('deptPerfBody');
  if (!tbody) return;
  tbody.innerHTML = DEPT_PERF.map(d => `
    <tr class="${d.rate >= 80 ? 'perf-row-compliant' : ''}">
      <td style="font-weight:600;font-size:.84rem">${d.name}</td>
      <td style="font-family:var(--font-m);font-size:.82rem">${d.total}</td>
      <td style="font-family:var(--font-m);font-size:.82rem;color:var(--green-600)">${d.verified}</td>
      <td style="font-family:var(--font-m);font-size:.82rem;color:var(--gold-600)">${d.pending}</td>
      <td>
        <div style="display:flex;align-items:center;gap:8px">
          <div class="compliance-bar"><div class="compliance-fill" style="width:${d.rate}%;background:${d.rate>=80?'var(--green-500)':'var(--gold-500)'}"></div></div>
          <span style="font-family:var(--font-m);font-size:.78rem;font-weight:700;color:${d.rate>=80?'var(--green-600)':'var(--gold-600)'}">${d.rate}%</span>
        </div>
      </td>
      <td style="font-family:var(--font-m);font-size:.78rem;color:var(--slate-500)">${d.avgDays}d avg</td>
      <td><span class="badge ${d.rate>=80?'badge-green':'badge-amber'}">${d.rate>=80?'On Track':'Needs Attention'}</span></td>
    </tr>
  `).join('');
}

function renderActionsRequired() {
  const el = document.getElementById('actionsRequired');
  if (!el) return;
  el.className = 'actions-required-list';
  el.innerHTML = DEADLINES.map(d => `
    <div class="ar-item" onclick="showPage('verification')">
      <div class="ar-urgency-dot" style="background:${d.urgency==='red'?'var(--red-500)':d.urgency==='amber'?'var(--amber-500)':'var(--green-500)'}"></div>
      <div class="ar-body">
        <div class="ar-title">${d.caseNo}</div>
        <div class="ar-meta">${d.desc}</div>
      </div>
      <span class="ar-days" style="color:${d.urgency==='red'?'var(--red-600)':d.urgency==='amber'?'var(--gold-600)':'var(--green-600)'}">${d.daysLeft}d</span>
    </div>
  `).join('');
}

/* ════════════════════════════════════════════════════════════
   13. SETTINGS
════════════════════════════════════════════════════════════ */
function initSettings() {
  try {
    const u = STATE.currentUser || JSON.parse(sessionStorage.getItem('ccms_user') || '{}');
    const initials = (u.name || 'SP').split(' ').map(w => w[0]).join('').substring(0,2).toUpperCase();
    const av   = document.getElementById('settingsAvatar');
    const nm   = document.getElementById('settingsName');
    const rl   = document.getElementById('settingsRole');
    const fn   = document.getElementById('sfFirstName');
    const ln   = document.getElementById('sfLastName');
    const em   = document.getElementById('sfEmail');
    if (av) av.textContent = initials;
    if (nm) nm.textContent = u.name || 'S. Patel';
    if (rl) rl.textContent = (u.role || 'Legal Officer') + ' · Revenue Department';
    if (fn && u.name) fn.value = u.name.split(' ')[0] || '';
    if (ln && u.name) ln.value = u.name.split(' ').slice(1).join(' ') || '';
    if (em && u.email) em.value = u.email;
  } catch(e) {}
}

function switchSettingsTab(btn, tab) {
  document.querySelectorAll('.settings-nav-item').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.settings-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  const tabEl = document.getElementById(`stab-${tab}`);
  if (tabEl) tabEl.classList.add('active');
  STATE.settingsTab = tab;
}

function saveProfileSettings() {
  const fn = document.getElementById('sfFirstName')?.value || '';
  const ln = document.getElementById('sfLastName')?.value || '';
  const em = document.getElementById('sfEmail')?.value || '';
  if (!fn || !ln) { showToast('First and last name are required', 'error'); return; }
  const name = `${fn} ${ln}`.trim();
  const u = STATE.currentUser || {};
  u.name  = name;
  u.email = em;
  STATE.currentUser = u;
  sessionStorage.setItem('ccms_user', JSON.stringify(u));
  loadUserIntoSidebar();
  showToast('Profile updated successfully', 'success');
}

function toggleHighContrast(on) {
  document.body.classList.toggle('high-contrast', on);
  showToast(`High contrast ${on ? 'enabled' : 'disabled'}`, 'info');
}

function toggleCompactSidebar(on) {
  document.getElementById('sidebar')?.classList.toggle('compact', on);
  showToast(`Compact sidebar ${on ? 'enabled' : 'disabled'}`, 'info');
}

function toggleApiKey() {
  const field = document.getElementById('apiKeyField');
  if (!field) return;
  field.type = field.type === 'password' ? 'text' : 'password';
}

/* ════════════════════════════════════════════════════════════
   14. NOTIFICATIONS
════════════════════════════════════════════════════════════ */
function initNotifications() {
  STATE.notifications      = NOTIFICATIONS.map(n => ({ ...n }));
  STATE.unreadNotifCount   = NOTIFICATIONS.filter(n => n.unread).length;
  updateNotifPips();
  renderNotifList();
}

function toggleNotifications(e) {
  if (e) e.stopPropagation();
  const panel   = document.getElementById('notifPanel');
  const backdrop = document.getElementById('notifBackdrop');
  if (!panel) return;
  const isOpen = panel.classList.contains('open');
  if (isOpen) {
    panel.classList.remove('open');
    if (backdrop) backdrop.classList.remove('open');
  } else {
    panel.classList.add('open');
    if (backdrop) backdrop.classList.add('open');
  }
}

function closeNotifPanel() {
  document.getElementById('notifPanel')?.classList.remove('open');
  document.getElementById('notifBackdrop')?.classList.remove('open');
}

function renderNotifList() {
  const el = document.getElementById('notifList');
  if (!el) return;
  el.innerHTML = STATE.notifications.map(n => `
    <div class="notif-item ${n.unread ? 'unread' : ''}" onclick="markNotifRead('${n.id}')">
      <div class="notif-dot-icon ${n.type}">${n.icon}</div>
      <div class="notif-item-body">
        <div class="notif-item-title">${n.title}</div>
        <div class="notif-item-desc">${n.desc}</div>
        <div class="notif-item-time">${n.time}</div>
      </div>
    </div>
  `).join('');
}

function markNotifRead(id) {
  const n = STATE.notifications.find(x => x.id === id);
  if (n && n.unread) {
    n.unread = false;
    STATE.unreadNotifCount = Math.max(0, STATE.unreadNotifCount - 1);
    updateNotifPips();
    renderNotifList();
  }
}

function markAllRead() {
  STATE.notifications.forEach(n => n.unread = false);
  STATE.unreadNotifCount = 0;
  updateNotifPips();
  renderNotifList();
  showToast('All notifications marked as read', 'success');
}

function updateNotifPips() {
  const count = STATE.unreadNotifCount;
  ['notifPip', 'desktopNotifPip', 'headerNotifPip'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = count > 0 ? 'block' : 'none';
  });
}

/* ════════════════════════════════════════════════════════════
   15. PROFILE MODAL
════════════════════════════════════════════════════════════ */
function openProfileModal() {
  const modal = document.getElementById('profileModal');
  if (!modal) return;
  try {
    const u        = STATE.currentUser || JSON.parse(sessionStorage.getItem('ccms_user') || '{}');
    const initials = (u.name || 'SP').split(' ').map(w => w[0]).join('').substring(0,2).toUpperCase();
    const av   = document.getElementById('profileModalAv');
    const nm   = document.getElementById('profileModalName');
    const rl   = document.getElementById('profileModalRole');
    const em   = document.getElementById('profileModalEmail');
    if (av) av.textContent = initials;
    if (nm) nm.textContent = u.name || 'S. Patel';
    if (rl) rl.textContent = u.role || 'Legal Officer';
    if (em) em.textContent = u.email || 'spatel@gov.in';
  } catch(e) {}

  // Recent activity
  const actEl = document.getElementById('pmActivityList');
  if (actEl) {
    actEl.innerHTML = RECENT_ACTIVITY.map(a => `
      <div class="pm-activity-item">
        <div class="pm-activity-icon" style="background:${a.bg}">${a.icon}</div>
        <div style="flex:1">
          <div>${a.text}</div>
          <div style="font-size:.7rem;color:var(--slate-400);font-family:var(--font-m)">${a.time}</div>
        </div>
      </div>
    `).join('');
  }

  modal.style.display = 'flex';
}

/* ════════════════════════════════════════════════════════════
   16. MODALS / EDIT FIELD
════════════════════════════════════════════════════════════ */
function openFieldEdit(label, value) {
  const modal = document.getElementById('editModal');
  const fn    = document.getElementById('editFieldName');
  const fv    = document.getElementById('editFieldValue');
  const fr    = document.getElementById('editReason');
  if (!modal) return;
  if (fn) fn.value = label;
  if (fv) fv.value = value;
  if (fr) fr.value = '';
  modal.style.display = 'flex';
}

function saveFieldEdit() {
  const name   = document.getElementById('editFieldName')?.value;
  const reason = document.getElementById('editReason')?.value;
  showToast(`"${name}" updated${reason ? ' — ' + reason : ''}`, 'success');
  closeModal('editModal');
}

/* ════════════════════════════════════════════════════════════
   17. DOM READY INIT
════════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  const isLoginPage = document.body.classList.contains('auth-body');
  const isAppPage   = document.body.classList.contains('app-body');

  /* ── Auth Page ─────────────────────────────────────────── */
  if (isLoginPage) {
    switchAuthTab('signin');

    // Live validation
    document.getElementById('signinEmail')?.addEventListener('input', function() {
      document.getElementById('signinEmailErr').textContent = '';
      this.classList.remove('error');
    });
    document.getElementById('signinPassword')?.addEventListener('input', function() {
      document.getElementById('signinPwdErr').textContent = '';
      this.classList.remove('error');
    });
    document.getElementById('signupEmail')?.addEventListener('blur', function() {
      if (this.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.value))
        showError('signupEmailErr', 'Please enter a valid email address');
    });
    document.getElementById('signupConfirm')?.addEventListener('input', function() {
      const pwd = document.getElementById('signupPwd')?.value || '';
      if (this.value && this.value !== pwd) showError('signupConfirmErr', 'Passwords do not match');
      else { document.getElementById('signupConfirmErr').textContent = ''; this.classList.remove('error'); }
    });
  }

  /* ── App Page ──────────────────────────────────────────── */
  if (isAppPage) {
    // Set demo user if not logged in
    if (!sessionStorage.getItem('ccms_user')) {
      sessionStorage.setItem('ccms_user', JSON.stringify({
        name: 'S. Patel', role: 'Legal Officer', email: 'spatel@revenue.gov.in'
      }));
    }

    loadUserIntoSidebar();
    initNotifications();
    updateClock();
    setInterval(updateClock, 60000);

    // Wire sidebar nav
    document.querySelectorAll('.nav-item[data-page]').forEach(item => {
      item.addEventListener('click', e => { e.preventDefault(); showPage(item.dataset.page); });
    });

    // Init first page
    initDashboard();
  }
});

/* ════════════════════════════════════════════════════════════
   18. CHANGE PASSWORD MODAL
════════════════════════════════════════════════════════════ */
function openChangePwdModal() {
  // Reset all fields
  ['cpOldPwd','cpNewPwd','cpConfirmPwd'].forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.value = ''; el.type = 'password'; }
  });
  ['cpOldErr','cpNewErr','cpConfirmErr'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = '';
  });
  const wrap = document.getElementById('cpStrengthWrap');
  if (wrap) wrap.style.display = 'none';
  // Reset requirements
  ['req-len','req-upper','req-num','req-special'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.className = 'pwd-req-item';
  });
  document.getElementById('changePwdModal').style.display = 'flex';
}

function checkNewPwdStrength(pwd) {
  const wrap   = document.getElementById('cpStrengthWrap');
  const bars   = [document.getElementById('cpb1'), document.getElementById('cpb2'), document.getElementById('cpb3'), document.getElementById('cpb4')];
  const label  = document.getElementById('cpStrengthLabel');
  if (!wrap) return;

  wrap.style.display = pwd.length ? 'block' : 'none';
  bars.forEach(b => { if (b) b.className = 'pwd-bar'; });

  let score = 0;
  if (pwd.length >= 8)           score++;
  if (/[A-Z]/.test(pwd))         score++;
  if (/[0-9]/.test(pwd))         score++;
  if (/[^A-Za-z0-9]/.test(pwd))  score++;

  const cls    = ['','active-weak','active-fair','active-good','active-strong'];
  const labels = ['','Weak','Fair','Good','Strong'];
  const colors = ['','#ef4444','#f59e0b','#3b7fbe','#22c55e'];
  for (let i = 0; i < score; i++) { if (bars[i]) bars[i].classList.add(cls[score]); }
  if (label) { label.textContent = labels[score] || ''; label.style.color = colors[score] || ''; }

  // Update requirement checklist
  const setReq = (id, met) => {
    const el = document.getElementById(id);
    if (el) el.className = 'pwd-req-item' + (met ? ' met' : '');
  };
  setReq('req-len',     pwd.length >= 8);
  setReq('req-upper',   /[A-Z]/.test(pwd));
  setReq('req-num',     /[0-9]/.test(pwd));
  setReq('req-special', /[^A-Za-z0-9]/.test(pwd));
}

function togglePwdById(inputId, btn) {
  const inp = document.getElementById(inputId);
  if (!inp) return;
  inp.type = inp.type === 'password' ? 'text' : 'password';
  if (btn) btn.querySelector('svg').style.opacity = inp.type === 'text' ? '0.5' : '1';
}

function submitChangePassword() {
  const old     = document.getElementById('cpOldPwd')?.value;
  const newPwd  = document.getElementById('cpNewPwd')?.value;
  const confirm = document.getElementById('cpConfirmPwd')?.value;
  let valid = true;

  ['cpOldErr','cpNewErr','cpConfirmErr'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = '';
  });

  if (!old) {
    const e = document.getElementById('cpOldErr');
    if (e) e.textContent = 'Please enter your current password';
    valid = false;
  }
  if (!newPwd || newPwd.length < 8) {
    const e = document.getElementById('cpNewErr');
    if (e) e.textContent = 'New password must be at least 8 characters';
    valid = false;
  }
  if (newPwd && old && newPwd === old) {
    const e = document.getElementById('cpNewErr');
    if (e) e.textContent = 'New password must be different from current password';
    valid = false;
  }
  if (newPwd !== confirm) {
    const e = document.getElementById('cpConfirmErr');
    if (e) e.textContent = 'Passwords do not match';
    valid = false;
  }
  if (!valid) return;

  const btn = document.getElementById('changePwdBtn');
  if (btn) {
    btn.disabled = true;
    const text   = btn.querySelector('.btn-text');
    const loader = btn.querySelector('.btn-loader');
    if (text)   text.style.display = 'none';
    if (loader) loader.style.display = 'inline-flex';
  }

  setTimeout(() => {
    closeModal('changePwdModal');
    if (btn) {
      btn.disabled = false;
      const text   = btn.querySelector('.btn-text');
      const loader = btn.querySelector('.btn-loader');
      if (text)   text.style.display = '';
      if (loader) loader.style.display = 'none';
    }
    showToast('Password updated successfully', 'success');
  }, 1800);
}

/* ════════════════════════════════════════════════════════════
   19. LOGIN HISTORY MODAL
════════════════════════════════════════════════════════════ */
const LOGIN_HISTORY = [
  { status:'success', event:'Signed in',          meta:'Windows 11 · Chrome 124 · Bengaluru, KA', time:'Today, 09:14 AM'  },
  { status:'success', event:'Signed in',          meta:'Android 14 · Chrome Mobile · Bengaluru, KA', time:'Today, 08:02 AM' },
  { status:'success', event:'Signed in',          meta:'Windows 11 · Chrome 124 · Bengaluru, KA', time:'Yesterday, 06:45 PM' },
  { status:'warning', event:'Password changed',   meta:'Windows 11 · Bengaluru, KA', time:'2 days ago, 11:30 AM' },
  { status:'success', event:'Signed in',          meta:'Windows 11 · Chrome 124 · Bengaluru, KA', time:'3 days ago, 09:00 AM' },
  { status:'failed',  event:'Failed login attempt', meta:'Unknown device · Mumbai, MH — IP: 203.x.x.x', time:'4 days ago, 02:15 AM' },
  { status:'success', event:'Signed in',          meta:'Windows 11 · Chrome 124 · Bengaluru, KA', time:'5 days ago, 08:55 AM' },
  { status:'success', event:'Session expired — auto sign-out', meta:'Android 14 · Chrome Mobile', time:'6 days ago, 11:00 PM' },
];

function openLoginHistoryModal() {
  const list = document.getElementById('loginHistoryList');
  if (list) {
    list.innerHTML = LOGIN_HISTORY.map(h => `
      <div class="lh-entry">
        <div class="lh-entry-dot ${h.status}"></div>
        <div class="lh-entry-info">
          <div class="lh-entry-event">${h.event}</div>
          <div class="lh-entry-meta">${h.meta}</div>
        </div>
        <div class="lh-entry-time">${h.time}</div>
      </div>
    `).join('');
  }
  document.getElementById('loginHistoryModal').style.display = 'flex';
}

function revokeSession(btn) {
  const item = btn.closest('.lh-session-item');
  if (!item) return;
  item.style.opacity = '0.5';
  btn.textContent = 'Revoked';
  btn.disabled = true;
  btn.style.color = 'var(--slate-400)';
  btn.style.borderColor = 'var(--slate-200)';
  showToast('Session revoked successfully', 'success');
}

function revokeAllSessions() {
  document.querySelectorAll('.lh-session-item:not(.current)').forEach(item => {
    item.style.opacity = '0.5';
    const btn = item.querySelector('.lh-revoke-btn');
    if (btn) { btn.textContent = 'Revoked'; btn.disabled = true; }
  });
  showToast('All other sessions have been revoked', 'success');
}

function downloadLoginHistory() {
  showToast('Login history exported as PDF', 'success');
}

/* ════════════════════════════════════════════════════════════
   20. API CONNECT MODAL
════════════════════════════════════════════════════════════ */
let _currentApiType = '';

const API_CONFIGS = {
  sc: {
    label: 'Supreme Court Portal API',
    icon:  'SC',
    iconBg: 'linear-gradient(135deg,#334155,#1e293b)',
    subtitle: 'Connect to fetch SLP orders & Supreme Court judgments',
    steps: [
      { title: 'Request API Credentials', desc: 'Visit supremecourt.gov.in/api-portal and request credentials for your department.' },
      { title: 'Enter API Endpoint URL',  desc: 'Paste the API base URL provided by NIC/SC portal team.' },
      { title: 'Enter Client ID & Secret', desc: 'Enter the OAuth2 client credentials from your approval letter.' },
      { title: 'Test Connection',          desc: 'Click Connect to validate credentials and start syncing.' },
    ],
    fields: [
      { id:'scApiUrl',    label:'API Endpoint URL',  placeholder:'https://api.supremecourt.gov.in/v1/', type:'text'     },
      { id:'scClientId',  label:'Client ID',          placeholder:'SC_CLIENT_XXXXXXXXXX',                type:'text'     },
      { id:'scSecretKey', label:'Client Secret',      placeholder:'••••••••••••••••',                   type:'password' },
      { id:'scDeptCode',  label:'Department Code',    placeholder:'KA-REV-001',                          type:'text'     },
    ],
  },
  digilocker: {
    label: 'DigiLocker Integration',
    icon:  'DL',
    iconBg: 'linear-gradient(135deg,var(--green-600),var(--green-700))',
    subtitle: 'Store verified action plans in official DigiLocker vaults',
    steps: [
      { title: 'Register on DigiLocker',    desc: 'Register your department at digilocker.gov.in/issuers and get issuer credentials.' },
      { title: 'Configure Namespace',        desc: 'Set a document namespace prefix for VerdictAI action plans.' },
      { title: 'Enter App Credentials',      desc: 'Enter the app ID and secret from your DigiLocker issuer dashboard.' },
      { title: 'Authorise & Connect',        desc: 'Authorise the connection — documents will automatically sync on verification.' },
    ],
    fields: [
      { id:'dlAppId',       label:'DigiLocker App ID',    placeholder:'DLAPP_XXXXXXXXXX', type:'text'     },
      { id:'dlAppSecret',   label:'App Secret',           placeholder:'••••••••••••••••',  type:'password' },
      { id:'dlNamespace',   label:'Document Namespace',   placeholder:'in.gov.karnataka.ccms', type:'text' },
      { id:'dlCallbackUrl', label:'Callback URL',         placeholder:'https://ccms.gov.in/dl/callback', type:'text' },
    ],
  },
};

function openApiConnectModal(type) {
  _currentApiType = type;
  const cfg  = API_CONFIGS[type];
  if (!cfg) return;

  // Set icon + title
  const iconEl = document.getElementById('apiConnectIcon');
  const titleEl = document.getElementById('apiConnectTitle');
  const subEl   = document.getElementById('apiConnectSubtitle');
  if (iconEl)  { iconEl.textContent = cfg.icon; iconEl.style.background = cfg.iconBg; }
  if (titleEl) titleEl.textContent = cfg.label;
  if (subEl)   subEl.textContent   = cfg.subtitle;

  // Build body
  const body = document.getElementById('apiConnectBody');
  if (!body) return;
  body.innerHTML = `
    <!-- Steps -->
    <div style="background:var(--slate-50);border:1px solid var(--slate-200);border-radius:var(--r);padding:14px 16px;margin-bottom:4px">
      <div style="font-size:.72rem;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--slate-400);margin-bottom:10px">How to Connect</div>
      ${cfg.steps.map((s, i) => `
        <div class="api-connect-step">
          <div class="api-step-num">${i + 1}</div>
          <div class="api-step-body">
            <div class="api-step-title">${s.title}</div>
            <div class="api-step-desc">${s.desc}</div>
          </div>
        </div>
      `).join('')}
    </div>
    <!-- Credential fields -->
    ${cfg.fields.map(f => `
      <div class="mform-group">
        <label>${f.label}</label>
        <input type="${f.type}" id="${f.id}" class="mform-input" placeholder="${f.placeholder}" />
      </div>
    `).join('')}
  `;

  document.getElementById('apiConnectModal').style.display = 'flex';
}

function submitApiConnect() {
  const cfg = API_CONFIGS[_currentApiType];
  if (!cfg) return;

  // Basic validation — all fields required
  let allFilled = true;
  cfg.fields.forEach(f => {
    const el = document.getElementById(f.id);
    if (!el || !el.value.trim()) { allFilled = false; if (el) el.style.borderColor = 'var(--red-400)'; }
    else if (el) el.style.borderColor = '';
  });
  if (!allFilled) { showToast('Please fill in all credential fields', 'error'); return; }

  // Show progress animation
  const btn  = document.getElementById('apiConnectBtn');
  const body = document.getElementById('apiConnectBody');
  if (!btn || !body) return;

  btn.disabled = true;
  const btext  = btn.querySelector('.btn-text');
  const bload  = btn.querySelector('.btn-loader');
  if (btext) btext.style.display = 'none';
  if (bload) bload.style.display = 'inline-flex';

  const progressSteps = ['Validating credentials…', 'Testing endpoint…', 'Authorising department…', 'Connection established!'];
  body.innerHTML = `
    <div class="api-connect-progress" id="apiProgressWrap">
      ${progressSteps.map((s, i) => `
        <div class="api-progress-step" id="aps${i}">
          <div class="api-progress-dot">${i + 1}</div>
          <span>${s}</span>
        </div>
      `).join('')}
    </div>
  `;

  const delays = [0, 800, 1600, 2600];
  delays.forEach((d, i) => {
    setTimeout(() => {
      for (let j = 0; j < i; j++) {
        const el = document.getElementById(`aps${j}`);
        if (el) { el.classList.remove('active'); el.classList.add('done'); el.querySelector('.api-progress-dot').textContent = '✓'; }
      }
      const el = document.getElementById(`aps${i}`);
      if (el) el.classList.add('active');
    }, d);
  });

  setTimeout(() => {
    closeModal('apiConnectModal');
    btn.disabled = false;
    if (btext) btext.style.display = '';
    if (bload) bload.style.display = 'none';

    const cfg = API_CONFIGS[_currentApiType];
    showToast(`${cfg?.label || 'API'} connected successfully!`, 'success');

    // Update API tab UI to show connected
    updateApiIntegrationUI(_currentApiType);
  }, 3800);
}

function updateApiIntegrationUI(type) {
  const cfg = API_CONFIGS[type];
  if (!cfg) return;
  // Find the matching integration item and mark as connected
  const items = document.querySelectorAll('.api-integration-item');
  items.forEach(item => {
    const name = item.querySelector('.api-int-name')?.textContent || '';
    if (name.toLowerCase().includes(type === 'sc' ? 'supreme' : 'digilocker')) {
      item.classList.add('active');
      const meta = item.querySelector('.api-int-meta');
      if (meta) {
        meta.style.color = 'var(--green-600)';
        meta.innerHTML = `<span class="dot-online" style="width:6px;height:6px"></span> Connected · Just now`;
      }
      const btn = item.querySelector('button');
      if (btn) { btn.textContent = 'Sync Now'; btn.onclick = () => showToast(`${cfg.label} sync triggered`, 'success'); btn.className = 'btn btn-outline'; btn.style.cssText = 'font-size:.78rem;padding:5px 12px'; }
    }
  });
}

/* ════════════════════════════════════════════════════════════
   21. CHANGE PHOTO MODAL
════════════════════════════════════════════════════════════ */
const AVATAR_COLORS = [
  { bg:'linear-gradient(135deg,#1a3a5c,#255d91)', label:'Navy'     },
  { bg:'linear-gradient(135deg,#15803d,#22c55e)', label:'Green'    },
  { bg:'linear-gradient(135deg,#b45309,#f59e0b)', label:'Gold'     },
  { bg:'linear-gradient(135deg,#7c3aed,#a78bfa)', label:'Purple'   },
  { bg:'linear-gradient(135deg,#dc2626,#ef4444)', label:'Red'      },
  { bg:'linear-gradient(135deg,#0e7490,#22d3ee)', label:'Teal'     },
  { bg:'linear-gradient(135deg,#be185d,#f472b6)', label:'Pink'     },
  { bg:'linear-gradient(135deg,#1e293b,#475569)', label:'Slate'    },
];

let _selectedAvatarBg = AVATAR_COLORS[0].bg;

function openChangePhotoModal() {
  // Populate colour grid
  const grid = document.getElementById('cpColorGrid');
  if (grid) {
    grid.innerHTML = AVATAR_COLORS.map((c, i) => `
      <div class="cp-color-swatch ${i === 0 ? 'selected' : ''}"
           style="background:${c.bg}" title="${c.label}"
           onclick="selectAvatarColor(this,'${c.bg.replace(/'/g,'\\\'')}')"
      ></div>
    `).join('');
  }

  // Set preview initials from current user
  try {
    const u = STATE.currentUser || JSON.parse(sessionStorage.getItem('ccms_user') || '{}');
    const initials = (u.name || 'SP').split(' ').map(w => w[0]).join('').substring(0,2).toUpperCase();
    const av = document.getElementById('cpPreviewAv');
    const nm = document.getElementById('cpPreviewName');
    const inp = document.getElementById('cpInitialsInput');
    if (av)  { av.textContent = initials; av.style.background = _selectedAvatarBg; }
    if (nm)  nm.textContent = u.name || 'S. Patel';
    if (inp) inp.value = initials;
  } catch(e) {}

  document.getElementById('changePhotoModal').style.display = 'flex';
}

function selectAvatarColor(el, bg) {
  _selectedAvatarBg = bg;
  document.querySelectorAll('.cp-color-swatch').forEach(s => s.classList.remove('selected'));
  el.classList.add('selected');
  const av = document.getElementById('cpPreviewAv');
  if (av) av.style.background = bg;
}

function previewInitials(val) {
  const av = document.getElementById('cpPreviewAv');
  if (av) av.textContent = val.toUpperCase().substring(0, 2) || '?';
}

function handlePhotoUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  if (file.size > 2 * 1024 * 1024) { showToast('Photo must be under 2 MB', 'error'); return; }
  const reader = new FileReader();
  reader.onload = (e) => {
    const av = document.getElementById('cpPreviewAv');
    if (av) {
      av.style.backgroundImage = `url(${e.target.result})`;
      av.style.backgroundSize  = 'cover';
      av.style.backgroundPosition = 'center';
      av.textContent = '';
    }
    showToast('Photo previewed — click Save Changes to apply', 'info');
  };
  reader.readAsDataURL(file);
}

function saveProfilePhoto() {
  const initials = document.getElementById('cpInitialsInput')?.value.toUpperCase().substring(0,2) || 'SP';

  // Apply to all avatars in the app
  ['sidebarAvatar','settingsAvatar','profileModalAv','cpPreviewAv'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.textContent = initials;
      el.style.background = _selectedAvatarBg;
      el.style.backgroundImage = '';
    }
  });

  closeModal('changePhotoModal');
  showToast('Profile photo updated successfully', 'success');
}

/* ════════════════════════════════════════════════════════════
   22. NIC SSO (login.html)
════════════════════════════════════════════════════════════ */
let _ssoOrg = 'Karnataka GoK';

function handleNicSSO() {
  document.getElementById('nicSsoModal').style.display = 'flex';
}

function selectSsoOrg(el, org) {
  _ssoOrg = org;
  document.querySelectorAll('.sso-org-item').forEach(i => i.classList.remove('selected'));
  el.classList.add('selected');
}

function submitNicSSO() {
  const emailEl = document.getElementById('ssoEmailInput');
  const errEl   = document.getElementById('ssoEmailErr');
  if (!emailEl) return;

  const email = emailEl.value.trim();
  if (errEl) errEl.textContent = '';

  if (!email) {
    if (errEl) errEl.textContent = 'Please enter your government email';
    emailEl.style.borderColor = 'var(--red-400)';
    return;
  }
  if (!email.includes('.gov.in') && !email.includes('nic.in')) {
    if (errEl) errEl.textContent = 'Must be an official .gov.in or nic.in email address';
    emailEl.style.borderColor = 'var(--red-400)';
    return;
  }
  emailEl.style.borderColor = '';

  const btn  = document.getElementById('ssoConnectBtn');
  if (btn) {
    btn.disabled = true;
    const btext = btn.querySelector('.btn-text');
    const bload = btn.querySelector('.btn-loader');
    if (btext) btext.style.display = 'none';
    if (bload) bload.style.display = 'inline-flex';
  }

  setTimeout(() => {
    if (btn) { btn.disabled = false; const t = btn.querySelector('.btn-text'); const l = btn.querySelector('.btn-loader'); if (t) t.style.display=''; if (l) l.style.display='none'; }
    // Build user name from email
    const raw   = email.split('@')[0].replace(/[._]/g,' ');
    const name  = raw.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    sessionStorage.setItem('ccms_user', JSON.stringify({ name, role:'Legal Officer', email, org: _ssoOrg, loginMethod:'SSO' }));
    document.getElementById('nicSsoModal').style.display = 'none';
    showToast('SSO authentication successful! Redirecting...', 'success');
    setTimeout(() => { window.location.href = 'index.html'; }, 1000);
  }, 2000);
}

function closeSsoModal(e, id) {
  if (e.target.classList.contains('modal-overlay')) document.getElementById(id).style.display = 'none';
}

/* ════════════════════════════════════════════════════════════
   23. DIGILOCKER LOGIN (login.html)
════════════════════════════════════════════════════════════ */
let _dlOtpTimer = null;

function handleDigiLockerLogin() {
  // Reset to step 1
  const step1 = document.getElementById('dlStep1');
  const step2 = document.getElementById('dlStep2');
  if (step1) step1.style.display = 'flex';
  if (step2) step2.style.display = 'none';
  const mEl = document.getElementById('dlMobile');
  const eEl = document.getElementById('dlMobileErr');
  if (mEl) mEl.value = '';
  if (eEl) eEl.textContent = '';
  document.getElementById('digiLockerModal').style.display = 'flex';
}

function requestDlOtp() {
  const mEl = document.getElementById('dlMobile');
  const eEl = document.getElementById('dlMobileErr');
  const mobile = mEl?.value.replace(/\D/g,'') || '';

  if (eEl) eEl.textContent = '';
  if (mobile.length !== 10) {
    if (eEl) eEl.textContent = 'Please enter a valid 10-digit mobile number';
    if (mEl) mEl.style.borderColor = 'var(--red-400)';
    return;
  }
  if (mEl) mEl.style.borderColor = '';

  // Simulate send
  const btn = document.querySelector('#dlStep1 .auth-submit-btn');
  if (btn) {
    btn.disabled = true;
    const t = btn.querySelector('.btn-text');
    const l = btn.querySelector('.btn-loader');
    if (t) t.style.display = 'none';
    if (l) l.style.display = 'inline-flex';
  }

  setTimeout(() => {
    if (btn) { btn.disabled = false; const t = btn.querySelector('.btn-text'); const l = btn.querySelector('.btn-loader'); if (t) t.style.display=''; if (l) l.style.display='none'; }
    // Switch to step 2
    const s1 = document.getElementById('dlStep1');
    const s2 = document.getElementById('dlStep2');
    if (s1) s1.style.display = 'none';
    if (s2) s2.style.display = 'flex';
    // Clear OTP boxes
    document.querySelectorAll('#dlOtpBoxes .otp-box').forEach(b => b.value = '');
    document.querySelectorAll('#dlOtpBoxes .otp-box')[0]?.focus();
    startDlOtpTimer();
    showToast(`OTP sent to +91-${mobile.substring(0,3)}XXXXX${mobile.slice(-2)}`, 'success');
  }, 1400);
}

function startDlOtpTimer() {
  if (_dlOtpTimer) clearInterval(_dlOtpTimer);
  let secs = 600;
  const el  = document.getElementById('dlOtpTimer');
  const tick = () => {
    if (!el) { clearInterval(_dlOtpTimer); return; }
    const m = String(Math.floor(secs / 60)).padStart(2,'0');
    const s = String(secs % 60).padStart(2,'0');
    el.textContent = `Expires in ${m}:${s}`;
    if (secs <= 0) { el.textContent = 'OTP expired'; clearInterval(_dlOtpTimer); }
    secs--;
  };
  tick();
  _dlOtpTimer = setInterval(tick, 1000);
}

function verifyDlOtp() {
  const boxes = document.querySelectorAll('#dlOtpBoxes .otp-box');
  const otp   = Array.from(boxes).map(b => b.value.trim()).join('');
  if (otp.length < 6) { showToast('Please enter all 6 OTP digits', 'error'); return; }

  const btn = document.getElementById('dlVerifyBtn');
  if (btn) {
    btn.disabled = true;
    const t = btn.querySelector('.btn-text');
    const l = btn.querySelector('.btn-loader');
    if (t) t.style.display = 'none';
    if (l) l.style.display = 'inline-flex';
  }

  setTimeout(() => {
    if (_dlOtpTimer) clearInterval(_dlOtpTimer);
    document.getElementById('digiLockerModal').style.display = 'none';
    const mobile = document.getElementById('dlMobile')?.value || '0000000000';
    sessionStorage.setItem('ccms_user', JSON.stringify({
      name: 'DigiLocker User', role: 'Legal Officer',
      email: `user${mobile.slice(-4)}@digilocker.gov.in`,
      loginMethod: 'DigiLocker'
    }));
    showToast('DigiLocker verification successful! Redirecting...', 'success');
    setTimeout(() => { window.location.href = 'index.html'; }, 1000);
  }, 1800);
}