/* utils/seed.js ──────────────────────────────────────────────
   Populates the database with the mock data that mirrors
   the frontend hard-coded arrays in app.js.
   Run: node utils/seed.js
─────────────────────────────────────────────────────────── */
'use strict';

require('dotenv').config();
const { connectDB } = require('../config/db');
const {
  User, Case, Extraction, ActionPlan, QueueItem, VerifiedRecord,
} = require('../models');

async function seed() {
  await connectDB();
  console.log('🌱 Seeding database …\n');

  /* ── 1. Admin user ──────────────────────────────────────── */
  const [admin] = await User.upsert({
    firstName:    'System',
    lastName:     'Admin',
    email:        'admin@ccms.gov.in',
    employeeId:   'EMP-001',
    department:   'IT / Administration',
    role:         'admin',
    passwordHash: 'Admin@12345',   // hashed by BeforeCreate hook
    isActive:     true,
  }, { returning: true });

  const [officer] = await User.upsert({
    firstName:    'S.',
    lastName:     'Patel',
    email:        'spatel@gov.in',
    employeeId:   'EMP-002',
    department:   'Legal Cell',
    role:         'legal_officer',
    passwordHash: 'Legal@12345',
    isActive:     true,
  }, { returning: true });

  const [nodal] = await User.upsert({
    firstName:    'R.',
    lastName:     'Kumar',
    email:        'rkumar@gov.in',
    employeeId:   'EMP-003',
    department:   'Revenue Department',
    role:         'nodal_officer',
    passwordHash: 'Nodal@12345',
    isActive:     true,
  }, { returning: true });

  console.log('✅  Users seeded.');

  /* ── 2. Cases ───────────────────────────────────────────── */
  const caseDefs = [
    { caseNo: 'WP/14832/2024', dateOfOrder: '2024-03-15', department: 'Revenue', nature: 'Service Matter',    status: 'pending_verification', aiScore: 94, petitioner: 'Rajesh Kumar Sharma',      respondent: 'State of Karnataka & Ors.',   court: 'High Court of Karnataka', bench: 'Justice A.K. Verma, Justice S. Reddy', disposal: 'Disposed of', limitationPeriod: '90 days (appeal)',     actionType: 'compliance' },
    { caseNo: 'SLP/8901/2024',  dateOfOrder: '2024-04-02', department: 'Finance', nature: 'Tax Dispute',       status: 'pending_verification', aiScore: 87, petitioner: 'Patel Industries Pvt. Ltd.', respondent: 'Revenue Department',          court: 'Supreme Court of India',  bench: 'Justice M. Sharma',                    disposal: 'Remanded',    limitationPeriod: '30 days (compliance)', actionType: 'appeal'     },
    { caseNo: 'WP/22107/2023',  dateOfOrder: '2024-01-18', department: 'Urban',   nature: 'Contempt',          status: 'critical',             aiScore: 78, petitioner: 'Municipal Corp of Bangalore', respondent: 'State Govt & Citizens',       court: 'High Court of Karnataka', bench: 'Justice R. Iyer',                      disposal: 'Contempt Notice', limitationPeriod: '15 days (urgent)', actionType: 'compliance' },
    { caseNo: 'CRP/5544/2024',  dateOfOrder: '2024-02-10', department: 'PWD',     nature: 'Land Dispute',      status: 'verified',             aiScore: 91, petitioner: 'Farmers Welfare Assoc.',     respondent: 'PWD & Land Acquisition',     court: 'High Court of Karnataka', bench: 'Justice P. Nair',                      disposal: 'Disposed of', limitationPeriod: '60 days',              actionType: 'compliance' },
    { caseNo: 'WA/1120/2024',   dateOfOrder: '2024-02-28', department: 'Home',    nature: 'Service Matter',    status: 'pending_verification', aiScore: 72, petitioner: 'IPS Officers Assoc.',        respondent: 'Home Department',            court: 'Division Bench HC',       bench: 'Justice K. Rao, Justice L. Das',       disposal: 'Partial Relief', limitationPeriod: '45 days',           actionType: 'appeal'     },
    { caseNo: 'WP/33901/2023',  dateOfOrder: '2023-11-05', department: 'Revenue', nature: 'Land Acquisition',  status: 'verified',             aiScore: 96, petitioner: 'Krishnamurthy & Ors.',       respondent: 'BDA & State Govt',           court: 'High Court of Karnataka', bench: 'Justice S. Menon',                     disposal: 'Disposed of', limitationPeriod: 'Expired',              actionType: 'compliance' },
  ];

  const createdCases = [];
  for (const def of caseDefs) {
    const [c] = await Case.upsert({ ...def, uploadedBy: officer.id }, { returning: true });
    createdCases.push(c);
  }
  console.log(`✅  ${createdCases.length} cases seeded.`);

  /* ── 3. Extractions ─────────────────────────────────────── */
  const extractionDefs = [
    {
      caseNo: 'WP/14832/2024',
      caseDetails:  [{ label: 'Case Number', value: 'WP/14832/2024' }, { label: 'Court', value: 'High Court of Karnataka' }, { label: 'Bench', value: 'Justice A.K. Verma, Justice S. Reddy' }, { label: 'Date of Order', value: '15th March, 2024' }, { label: 'Case Type', value: 'Writ Petition (Civil)' }, { label: 'Disposal', value: 'Disposed of' }],
      parties:     [{ role: 'Petitioner', name: 'Rajesh Kumar Sharma', tag: 'Petitioner' }, { role: 'Respondent 1', name: 'State of Karnataka', tag: 'State' }, { role: 'Respondent 2', name: 'Principal Secretary, Revenue', tag: 'Respondent' }, { role: 'Respondent 3', name: 'District Collector, Bengaluru', tag: 'Respondent' }],
      directions:  [{ text: 'The respondent State is directed to grant the petitioner a personal hearing within 30 days from today.', type: 'critical', tag: 'Critical' }, { text: 'The concerned department shall file a compliance report before this Court within 45 days.', type: 'important', tag: 'Important' }, { text: 'Failure to comply shall attract consequences under Contempt of Courts Act, 1971.', type: 'critical', tag: 'Critical' }, { text: 'The writ petition is accordingly disposed of with liberty to approach Court if non-compliance occurs.', type: 'standard', tag: 'Standard' }],
      timelines:   [{ event: 'Grant Personal Hearing', date: '14 Apr 2024', daysLeft: '14 days left', urgency: 'red' }, { event: 'File Compliance Report', date: '29 Apr 2024', daysLeft: '29 days left', urgency: 'amber' }, { event: 'Limitation Period — Appeal', date: '15 Jun 2024', daysLeft: '76 days left', urgency: 'blue' }],
      confidence:  94,
    },
    {
      caseNo: 'SLP/8901/2024',
      caseDetails:  [{ label: 'Case Number', value: 'SLP/8901/2024' }, { label: 'Court', value: 'Supreme Court of India' }, { label: 'Bench', value: 'Justice M. Sharma' }, { label: 'Date of Order', value: '2nd April, 2024' }, { label: 'Case Type', value: 'Special Leave Petition' }, { label: 'Disposal', value: 'Remanded to HC' }],
      parties:     [{ role: 'Petitioner', name: 'Patel Industries Pvt. Ltd.', tag: 'Petitioner' }, { role: 'Respondent 1', name: 'Revenue Department, Karnataka', tag: 'Respondent' }],
      directions:  [{ text: 'Matter remanded to the High Court for fresh consideration on merits of tax assessment.', type: 'important', tag: 'Important' }, { text: 'Revenue Department directed to provide all relevant records within 30 days.', type: 'critical', tag: 'Critical' }, { text: 'High Court to take up matter within 60 days of receipt of remand order.', type: 'standard', tag: 'Standard' }],
      timelines:   [{ event: 'Provide Records to HC', date: '02 May 2024', daysLeft: '8 days left', urgency: 'red' }, { event: 'HC Hearing Scheduled', date: '02 Jun 2024', daysLeft: '39 days left', urgency: 'amber' }],
      confidence:  87,
    },
    {
      caseNo: 'WP/22107/2023',
      caseDetails:  [{ label: 'Case Number', value: 'WP/22107/2023' }, { label: 'Court', value: 'High Court of Karnataka' }, { label: 'Bench', value: 'Justice R. Iyer' }, { label: 'Date of Order', value: '18th January, 2024' }, { label: 'Case Type', value: 'Contempt of Court' }, { label: 'Disposal', value: 'Contempt Notice Issued' }],
      parties:     [{ role: 'Petitioner', name: 'Citizens for Clean City (NGO)', tag: 'Petitioner' }, { role: 'Respondent 1', name: 'Municipal Corporation of Bangalore', tag: 'Respondent' }, { role: 'Respondent 2', name: 'State Government of Karnataka', tag: 'Respondent' }],
      directions:  [{ text: 'Municipal Corporation to appear and show cause for non-compliance with earlier order dated 10 Oct 2023.', type: 'critical', tag: 'Critical' }, { text: 'Commissioner, BBMP personally directed to file affidavit explaining non-compliance within 15 days.', type: 'critical', tag: 'Critical' }, { text: 'Contempt proceedings initiated under Section 12 of the Contempt of Courts Act, 1971.', type: 'critical', tag: 'Critical' }],
      timelines:   [{ event: 'File Affidavit of Non-Compliance', date: '02 Feb 2024', daysLeft: '3 days left!', urgency: 'red' }, { event: 'Contempt Hearing', date: '15 Feb 2024', daysLeft: '16 days left', urgency: 'amber' }],
      confidence:  78,
    },
  ];

  for (const def of extractionDefs) {
    const c = createdCases.find(x => x.caseNo === def.caseNo);
    if (!c) continue;
    await Extraction.upsert({ caseId: c.id, ...def, editsLog: [], modelVersion: 'ccms-seed-v1' });
  }
  console.log('✅  Extractions seeded.');

  /* ── 4. Action Plans (abbreviated — one per case) ───────── */
  for (const c of createdCases) {
    const hasCritical = true;
    await ActionPlan.upsert({
      caseId:         c.id,
      recommendation: hasCritical ? 'COMPLY WITH ORDER' : 'REVIEW & RESPOND',
      emoji:          '⚖️',
      reason:         'Strong direction with contempt clause — compliance is mandatory within 30 days',
      confidence:     c.aiScore || 80,
      actions:        [
        { title: 'Schedule Personal Hearing', desc: 'Coordinate with petitioner and fix a date within 30 days as directed.', priority: 'urgent', icon: '📅', tags: ['30 days', c.department], bg: '#fef2f2' },
        { title: 'Prepare Compliance Report', desc: 'Draft compliance report for submission to Court within 45 days.',        priority: 'high',   icon: '📝', tags: ['45 days', 'Legal Cell'], bg: '#fffbeb' },
      ],
      timeline:    [{ day: 'Day 0', title: 'Order Received', desc: 'Uploaded and extracted', state: 'done', date: c.dateOfOrder }],
      departments: [{ abbr: 'LC', name: 'Legal Cell', role: 'Primary respondent', badge: 'primary' }],
      risks:       [{ level: 'HIGH', title: 'Contempt Risk', desc: 'Non-compliance may invite contempt proceedings', cls: 'h' }],
      isPublished: c.status === 'verified',
    });
  }
  console.log('✅  Action plans seeded.');

  /* ── 5. Queue items ─────────────────────────────────────── */
  const queueDefs = [
    { caseNo: 'WP/14832/2024', description: 'Service Matter — Revenue Dept', confidence: 94, status: 'pending'  },
    { caseNo: 'SLP/8901/2024',  description: 'Tax Dispute — Finance Dept',    confidence: 87, status: 'pending'  },
    { caseNo: 'WP/22107/2023',  description: 'Contempt — BBMP vs Citizens',   confidence: 78, status: 'pending'  },
    { caseNo: 'CRP/5544/2024',  description: 'Land Dispute — PWD',            confidence: 91, status: 'approved' },
    { caseNo: 'WA/1120/2024',   description: 'Service Matter — Home Dept',    confidence: 72, status: 'pending'  },
  ];

  for (const def of queueDefs) {
    const c = createdCases.find(x => x.caseNo === def.caseNo);
    if (!c) continue;
    await QueueItem.upsert({ caseId: c.id, ...def });
  }
  console.log('✅  Queue items seeded.');

  /* ── 6. Verified Records ────────────────────────────────── */
  const verifiedDefs = [
    { caseNo: 'WP/33901/2023', title: 'Krishnamurthy vs BDA & State Govt',   department: 'Revenue Department',    actionType: 'compliance', actions: ['Acquire land as per compensation order within 60 days', 'File compliance report — Deadline: 05 Jan 2024', 'Notify affected parties of payment schedule'], verifiedOn: '2023-11-08', deadline: '2024-01-05', deadlineClass: 'safe',   isCritical: false, aiScore: 96 },
    { caseNo: 'CRP/5544/2024',  title: 'Farmers Welfare Assoc vs PWD',        department: 'Public Works Department', actionType: 'compliance', actions: ['Halt land acquisition proceedings pending survey', 'Conduct joint survey within 21 days', 'File joint memo before court'],                                                                  verifiedOn: '2024-02-15', deadline: '2024-03-03', deadlineClass: 'normal', isCritical: false, aiScore: 91 },
    { caseNo: 'WP/9210/2023',   title: 'Teachers Union vs Education Dept',    department: 'Education Department',  actionType: 'appeal',     actions: ['Evaluate grounds for SLP before Supreme Court', 'Limitation: 90 days from 20 Oct 2023', 'Coordinate with Advocate General office'],                                                                 verifiedOn: '2023-10-25', deadline: '2024-01-18', deadlineClass: 'urgent', isCritical: true,  aiScore: 83 },
  ];

  for (const def of verifiedDefs) {
    const c = createdCases.find(x => x.caseNo === def.caseNo);
    const caseId = c?.id || null;
    await VerifiedRecord.upsert({
      caseId:          caseId,
      verifiedById:    officer.id,
      verifiedByLabel: 'S. Patel — Legal Officer',
      ...def,
    });
  }
  console.log('✅  Verified records seeded.');

  console.log('\n🎉  Database seeded successfully!');
  console.log('\n📋  Test accounts:');
  console.log('    Admin:   admin@ccms.gov.in   / Admin@12345');
  console.log('    Officer: spatel@gov.in        / Legal@12345');
  console.log('    Nodal:   rkumar@gov.in        / Nodal@12345');
  process.exit(0);
}

seed().catch(err => {
  console.error('❌  Seed failed:', err);
  process.exit(1);
});