import { useState } from 'react';

interface OnboardingProps {
  isDarkMode: boolean;
  onBackToProjects: () => void;
}

export default function Onboarding({ isDarkMode, onBackToProjects }: OnboardingProps) {
  const [activeTab, setActiveTab] = useState<'systems' | 'products' | 'process' | 'report' | 'automation'>('systems');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const systemUrls = [
    {
      code: "PD",
      name: "Paramount Direct",
      links: [
        { env: "DEV", url: "https://paramountdirectdev.herokuapp.com/" },
        { env: "LIVE", url: "https://www.paramountdirect.com/" }
      ]
    },
    {
      code: "PD WEBSERVICE",
      name: "PD WebService & Admin",
      links: [
        { env: "DEV", url: "https://paramountdirectdev.herokuapp.com/admin" },
        { env: "DEMO", url: "https://paramountdirectdemo.herokuapp.com/admin" },
        { env: "LIVE", url: "https://www.paramountdirect.com/admin" }
      ]
    },
    {
      code: "OFW",
      name: "OFW Insurance Website",
      links: [
        { env: "STAGING", url: "https://plgic-ofw-staging.herokuapp.com/" },
        { env: "LIVE", url: "https://ofwinsurance.ph/" }
      ]
    },
    {
      code: "GTP",
      name: "Global Travel Protect",
      links: [
        { env: "STAGING", url: "https://globaltravelprotectstaging.herokuapp.com/" },
        { env: "LIVE", url: "http://yourtravelinsurance.ph/" }
      ]
    },
    {
      code: "CTPL",
      name: "CTPL Vehicle Insurance",
      links: [
        { env: "STAGING", url: "https://ctpl-demo.herokuapp.com/" },
        { env: "LIVE", url: "https://ctpl.ph/" }
      ]
    },
    {
      code: "CORP",
      name: "Corporate Web Platform",
      links: [
        { env: "STAGING", url: "https://plgic-staging-859886ab9df0.herokuapp.com/" },
        { env: "LIVE", url: "https://paramount.com.ph/" }
      ]
    }
  ];

  const productCatalog = [
    {
      category: "LIFE - HEALTH",
      type: "Life",
      items: [
        "HealthCare Cash Plan - HCP",
        "Hospital Income Benefit Plan - HIP",
        "PrimeCare Cash Plan - PCP",
        "Premium HealthCare Plus Plan - PHC"
      ]
    },
    {
      category: "LIFE & ACCIDENT",
      type: "Life",
      items: [
        "Guaranteed Life Plan - GLP",
        "Golden Life Advantage Plan - GLA",
        "Go Protect Plan - GPR"
      ]
    },
    {
      category: "COMPREHENSIVE",
      type: "Life",
      items: [
        "MoneyPlus Protection Plan - MPR",
        "Sure Savings Plan - SSP",
        "PrimeHealth Cash Plan - PHP",
        "Dream College Plan - DRE"
      ]
    },
    {
      category: "OTHER PRODUCTS",
      type: "Programs",
      items: [
        "Employee Referral Program - ERP",
        "Rewards And Perks - REAP"
      ]
    },
    {
      category: "NON-LIFE",
      type: "Non-Life",
      items: [
        "Overseas Filipino Workers - OFW",
        "Global Travel Protect Premium - GTPH",
        "Compulsory Third Party Liability - CTPL"
      ]
    }
  ];

  const toolsList = [
    { purpose: "Ticketing", tool: "JIRA" },
    { purpose: "Test Documentation", tool: "Google Docs, Sheets, via JIRA Comments" },
    { purpose: "Screenshots / Recording", tool: "Snipping Tool, ShareX (free open-source tool)" },
    { purpose: "API Testing", tool: "Postman" },
    { purpose: "Test Automation", tool: "Playwright" },
    { purpose: "Designing", tool: "Canva" }
  ];

  const samplePlaywrightCode = `import { test, expect } from '@playwright/test';

test('Paramount Direct - Verify Login Flow', async ({ page }) => {
  await page.goto('http://localhost:5173/login');
  
  // Fill credentials
  await page.fill('input[type="email"]', 'admin@paramount.com.ph');
  await page.fill('input[type="password"]', 'password123');
  
  // Submit login
  await page.click('button:has-text("SIGN IN")');
  
  // Assert navigation
  await expect(page).toHaveURL(/.*systems/);
  await expect(page.locator('h1')).toContainText('Systems & Web Applications');
});`;

  return (
    <div className={`flex flex-col min-h-[calc(100vh-73px)] ${isDarkMode ? 'dark bg-[#080C14] text-white' : 'bg-[#EBF1F6] text-slate-900'}`}>
      
      {/* Top Navigation Bar */}
      <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl border-b border-white/80 dark:border-slate-800/80 px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <button 
            onClick={onBackToProjects}
            className="text-xs font-bold text-slate-500 hover:text-[#10065F] dark:hover:text-white flex items-center space-x-1.5 transition-all mb-1 cursor-pointer"
          >
            <span>&larr; Back to Dashboard</span>
          </button>
          <h1 className="text-xl font-black text-[#10065F] dark:text-white uppercase tracking-tight">
            QA & BA Team Onboarding Guide
          </h1>
        </div>

        {/* Tab Switcher */}
        <div className="flex flex-wrap bg-white/40 dark:bg-slate-950/40 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 backdrop-blur-md">
          <button
            onClick={() => setActiveTab('systems')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'systems' ? 'bg-[#10065F] dark:bg-blue-600 text-white shadow-md' : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            1. System URLs
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'products' ? 'bg-[#10065F] dark:bg-blue-600 text-white shadow-md' : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            2. Products & Agents
          </button>
          <button
            onClick={() => setActiveTab('process')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'process' ? 'bg-[#10065F] dark:bg-blue-600 text-white shadow-md' : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            3. Testing Process
          </button>
          <button
            onClick={() => setActiveTab('report')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'report' ? 'bg-[#10065F] dark:bg-blue-600 text-white shadow-md' : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            4. Test Report Template
          </button>
          <button
            onClick={() => setActiveTab('automation')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'automation' ? 'bg-[#10065F] dark:bg-blue-600 text-white shadow-md' : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            5. Playwright Setup
          </button>
        </div>
      </div>

      {/* Main Workspace Area */}
      <div className="p-6 md:p-10 max-w-6xl w-full mx-auto space-y-8 flex-1">

        {/* TAB 1: SYSTEM ENVIRONMENT URLS */}
        {activeTab === 'systems' && (
          <div className="space-y-6">
            <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl border border-white/80 dark:border-slate-800 rounded-[28px] p-6 shadow-xl">
              <h2 className="text-sm font-black uppercase tracking-wider text-[#10065F] dark:text-blue-400 mb-2">
                System Environments & Access Directory
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Official web application staging, demo, and production URLs across all Paramount insurance portals.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {systemUrls.map((sys) => (
                <div key={sys.code} className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl border border-white/80 dark:border-slate-800 rounded-[24px] p-5 shadow-md space-y-3">
                  <div className="flex justify-between items-center border-b border-slate-200/60 dark:border-slate-800 pb-2">
                    <span className="font-extrabold text-sm text-[#10065F] dark:text-white">{sys.name}</span>
                    <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-black border border-blue-500/20">
                      {sys.code}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {sys.links.map((link) => (
                      <div key={link.url} className="flex justify-between items-center bg-white/50 dark:bg-slate-950/40 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 text-xs">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold ${
                          link.env === 'LIVE' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' :
                          link.env === 'STAGING' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20' :
                          'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                        }`}>
                          {link.env}
                        </span>
                        <a 
                          href={link.url} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="font-mono text-xs text-blue-600 dark:text-blue-400 hover:underline truncate max-w-[280px]"
                        >
                          {link.url}
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: PRODUCTS & AGENTS CATALOG */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl border border-white/80 dark:border-slate-800 rounded-[28px] p-6 shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-sm font-black uppercase tracking-wider text-[#10065F] dark:text-blue-400 mb-1">
                  Products & Insurance Reference Matrix
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Comprehensive listing of Paramount Direct Life, Non-Life, and Comprehensive insurance plans.
                </p>
              </div>

              <a 
                href="https://docs.google.com/document/d/1ogmSHhqTaiqiBWRCAzbEX8pCtvRcoOZmF_rlo1btukA/edit?tab=t.0#heading=h.oerzeg34lrji" 
                target="_blank" 
                rel="noreferrer"
                className="px-4 py-2 rounded-xl bg-[#10065F] hover:bg-[#180A8C] dark:bg-blue-600 text-white font-black text-xs uppercase tracking-wider shadow-md transition-all shrink-0 flex items-center gap-1.5"
              >
                <span>View Source Doc</span>
                <span>&rarr;</span>
              </a>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {productCatalog.map((cat) => (
                <div key={cat.category} className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl border border-white/80 dark:border-slate-800 rounded-[24px] p-5 shadow-md space-y-3">
                  <div className="flex justify-between items-center border-b border-slate-200/60 dark:border-slate-800 pb-2">
                    <span className="font-extrabold text-xs text-[#10065F] dark:text-white uppercase">{cat.category}</span>
                    <span className="text-[10px] font-bold text-slate-400">{cat.type}</span>
                  </div>

                  <ul className="space-y-2">
                    {cat.items.map((item) => (
                      <li key={item} className="flex items-center text-xs font-semibold text-slate-700 dark:text-slate-300 gap-2 bg-white/40 dark:bg-slate-950/20 p-2 rounded-lg border border-slate-200/50 dark:border-slate-800">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#10065F] dark:bg-blue-400 shrink-0"></span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: QA TESTING PROCESS DOCUMENTATION */}
        {activeTab === 'process' && (
          <div className="space-y-6">
            <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl border border-white/80 dark:border-slate-800 rounded-[28px] p-6 shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-sm font-black uppercase tracking-wider text-[#10065F] dark:text-blue-400 mb-1">
                  Paramount QA Testing Process & Workflow
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Prepared by Arra | Objective: Provide a clear and detailed explanation of how software testing, tools, techniques, and workflows are conducted to ensure quality and consistency.
                </p>
              </div>

              <a 
                href="https://docs.google.com/document/d/1cxxtO3s4zY8jPEDs4lhJZ9lvqTq-vUqeOuwlYP4DPiY/edit?usp=sharing" 
                target="_blank" 
                rel="noreferrer"
                className="px-4 py-2 rounded-xl bg-[#10065F] hover:bg-[#180A8C] dark:bg-blue-600 text-white font-black text-xs uppercase tracking-wider shadow-md transition-all shrink-0 flex items-center gap-1.5"
              >
                <span>QA Process Doc</span>
                <span>&rarr;</span>
              </a>
            </div>

            {/* 1. Testing Workflow Overview */}
            <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl border border-white/80 dark:border-slate-800 rounded-[28px] p-6 shadow-md space-y-4">
              <h3 className="font-extrabold text-sm text-[#10065F] dark:text-white border-b border-slate-200/60 dark:border-slate-800 pb-3">
                1. Testing Workflow Overview
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-white/50 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800 space-y-2 text-xs">
                  <span className="font-black text-blue-600 dark:text-blue-400 block">i. Review Requirements / Tickets</span>
                  <ul className="list-disc list-inside space-y-1 text-slate-700 dark:text-slate-300 font-medium">
                    <li>Read Acceptance Criteria, User Stories, and Jira Cards.</li>
                    <li>Clarify if there's unclear acceptance criteria.</li>
                  </ul>

                  <span className="font-black text-blue-600 dark:text-blue-400 block pt-2">ii. Test Plan</span>
                  <ul className="list-disc list-inside space-y-1 text-slate-700 dark:text-slate-300 font-medium">
                    <li>Identify objective, scope, schedule, risk, affected module, scope, and related-functionality.</li>
                  </ul>

                  <span className="font-black text-blue-600 dark:text-blue-400 block pt-2">iii. Execution</span>
                  <ul className="list-disc list-inside space-y-1 text-slate-700 dark:text-slate-300 font-medium">
                    <li>Create a list of test cases.</li>
                    <li>Validate edge cases and negative cases.</li>
                    <li>Perform Functional Testing.</li>
                  </ul>
                </div>

                <div className="p-4 rounded-2xl bg-white/50 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800 space-y-2 text-xs">
                  <span className="font-black text-blue-600 dark:text-blue-400 block">iv. Bug Reporting</span>
                  <ul className="list-disc list-inside space-y-1 text-slate-700 dark:text-slate-300 font-medium">
                    <li>Create ticket for bug tracking.</li>
                    <li>Include documentation e.g., screenshots, video recording.</li>
                    <li>Specify exact test steps to replicate.</li>
                  </ul>

                  <span className="font-black text-blue-600 dark:text-blue-400 block pt-2">v. Re-testing and Regression</span>
                  <ul className="list-disc list-inside space-y-1 text-slate-700 dark:text-slate-300 font-medium">
                    <li>Re-test the bug fix.</li>
                    <li>Sanity Test the affected modules and related-functionality.</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Tools | Use Table */}
            <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl border border-white/80 dark:border-slate-800 rounded-[28px] p-6 shadow-md space-y-4">
              <h3 className="font-extrabold text-sm text-[#10065F] dark:text-white">
                Tools | Use Matrix
              </h3>
              
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-800 text-[#10065F] dark:text-blue-400 font-black">
                      <th className="p-3 border border-slate-200 dark:border-slate-700">Purpose</th>
                      <th className="p-3 border border-slate-200 dark:border-slate-700">Tool / Platform</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {toolsList.map((t) => (
                      <tr key={t.purpose} className="hover:bg-white/50 dark:hover:bg-slate-950/20">
                        <td className="p-3 border border-slate-200 dark:border-slate-700 font-bold text-slate-800 dark:text-slate-200">{t.purpose}</td>
                        <td className="p-3 border border-slate-200 dark:border-slate-700 font-mono text-slate-600 dark:text-slate-400">{t.tool}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 2. Test Case Format */}
            <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl border border-white/80 dark:border-slate-800 rounded-[28px] p-6 shadow-md space-y-4">
              <h3 className="font-extrabold text-sm text-[#10065F] dark:text-white">
                2. Standard Test Case Format
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse font-sans">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-800 text-[#10065F] dark:text-blue-400 font-black">
                      <th className="p-2.5 border border-slate-200 dark:border-slate-700">Test Case #</th>
                      <th className="p-2.5 border border-slate-200 dark:border-slate-700">Test Summary</th>
                      <th className="p-2.5 border border-slate-200 dark:border-slate-700">Expected Output</th>
                      <th className="p-2.5 border border-slate-200 dark:border-slate-700">System Output</th>
                      <th className="p-2.5 border border-slate-200 dark:border-slate-700">Test Status</th>
                      <th className="p-2.5 border border-slate-200 dark:border-slate-700">Test Remarks (if applicable)</th>
                      <th className="p-2.5 border border-slate-200 dark:border-slate-700">Test Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="text-slate-500 italic bg-white/30 dark:bg-slate-950/20">
                      <td className="p-2.5 border border-slate-200 dark:border-slate-700">TC-001</td>
                      <td className="p-2.5 border border-slate-200 dark:border-slate-700">Verify user login with valid credentials</td>
                      <td className="p-2.5 border border-slate-200 dark:border-slate-700">Redirected to Dashboard</td>
                      <td className="p-2.5 border border-slate-200 dark:border-slate-700">Dashboard displayed</td>
                      <td className="p-2.5 border border-slate-200 dark:border-slate-700 font-bold text-emerald-500">Passed</td>
                      <td className="p-2.5 border border-slate-200 dark:border-slate-700">N/A</td>
                      <td className="p-2.5 border border-slate-200 dark:border-slate-700 font-mono">admin@paramount.com.ph</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* 3. Cross-checking for Acceptance Criteria vs Test Cases */}
            <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl border border-white/80 dark:border-slate-800 rounded-[28px] p-6 shadow-md space-y-3">
              <h3 className="font-extrabold text-sm text-[#10065F] dark:text-white">
                3. Cross-checking for Acceptance Criteria vs. Test Cases
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 italic">
                To ensure complete test coverage, match every Acceptance Criterion (AC) in the ticket to at least one corresponding test case.
              </p>

              <div className="space-y-2 text-xs text-slate-700 dark:text-slate-300 font-medium">
                <div className="p-3 rounded-xl bg-white/50 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800">
                  <strong className="text-blue-600 dark:text-blue-400">A. Read Acceptance Criteria from User Story / Jira Ticket:</strong>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>Ensure each AC is clear and testable.</li>
                    <li>Raise clarifications if AC is vague or has missing edge cases.</li>
                  </ul>
                </div>

                <div className="p-3 rounded-xl bg-white/50 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800">
                  <strong className="text-blue-600 dark:text-blue-400">B. Create or Update Test Cases:</strong>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>Each AC becomes at least one test case in checklist.</li>
                    <li>For complex ACs, break them down into multiple test steps.</li>
                  </ul>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* TAB 4: STANDARDIZED TEST REPORT TEMPLATE */}
        {activeTab === 'report' && (
          <div className="space-y-6">
            <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl border border-white/80 dark:border-slate-800 rounded-[28px] p-6 shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-sm font-black uppercase tracking-wider text-[#10065F] dark:text-blue-400 mb-1">
                  Official QA Test Report Template Structure
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Paramount Life & General Insurance Corp. - QA Team Information Services Department
                </p>
              </div>

              <a 
                href="https://docs.google.com/document/d/1EO3ZMs7lGyRlvr6MUYXdThtOWqTywGs57_XRhJgcDrY/edit?usp=sharing" 
                target="_blank" 
                rel="noreferrer"
                className="px-4 py-2 rounded-xl bg-[#10065F] hover:bg-[#180A8C] dark:bg-blue-600 text-white font-black text-xs uppercase tracking-wider shadow-md transition-all shrink-0 flex items-center gap-1.5"
              >
                <span>Google Doc Template</span>
                <span>&rarr;</span>
              </a>
            </div>

            {/* Test Report Metadata Table */}
            <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl border border-white/80 dark:border-slate-800 rounded-[28px] p-6 shadow-md space-y-4">
              <div className="flex justify-between items-center border-b border-slate-200/60 dark:border-slate-800 pb-2">
                <span className="font-mono font-bold text-xs text-blue-600 dark:text-blue-400">[[division]: project_name / feature_name] [jira_id/reference]</span>
                <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 text-[10px] font-black uppercase">[date_finished] QA TEST REPORT</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse font-sans">
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    <tr>
                      <td className="p-2.5 border border-slate-200 dark:border-slate-700 font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 w-36">Description:</td>
                      <td className="p-2.5 border border-slate-200 dark:border-slate-700 font-mono text-slate-600 dark:text-slate-300">[brief description / name of the feature]</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 border border-slate-200 dark:border-slate-700 font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200">QA Envs Used:</td>
                      <td className="p-2.5 border border-slate-200 dark:border-slate-700 font-mono text-slate-600 dark:text-slate-300">[test_env]</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 border border-slate-200 dark:border-slate-700 font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200">DEV Assigned:</td>
                      <td className="p-2.5 border border-slate-200 dark:border-slate-700 font-mono text-slate-600 dark:text-slate-300">[dev_name]</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 border border-slate-200 dark:border-slate-700 font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200">QA Assigned:</td>
                      <td className="p-2.5 border border-slate-200 dark:border-slate-700 font-mono text-slate-600 dark:text-slate-300">[qa_name]</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 border border-slate-200 dark:border-slate-700 font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200">Test Result:</td>
                      <td className="p-2.5 border border-slate-200 dark:border-slate-700 font-mono text-emerald-500 font-bold">[pass / fail]</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 border border-slate-200 dark:border-slate-700 font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200">QA Recommendation:</td>
                      <td className="p-2.5 border border-slate-200 dark:border-slate-700 font-mono text-slate-600 dark:text-slate-300">[qaInitial_testing_remarks after test]</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 border border-slate-200 dark:border-slate-700 font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200">UAT Env:</td>
                      <td className="p-2.5 border border-slate-200 dark:border-slate-700 font-mono text-slate-600 dark:text-slate-300">[test_env]</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* About this Project Structure */}
            <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl border border-white/80 dark:border-slate-800 rounded-[28px] p-6 shadow-md space-y-3 text-xs">
              <h3 className="font-extrabold text-sm text-[#10065F] dark:text-white border-b border-slate-200/60 dark:border-slate-800 pb-2">
                About this Project Structure
              </h3>
              
              <ul className="space-y-2 text-slate-700 dark:text-slate-300">
                <li><strong className="text-blue-600 dark:text-blue-400">a. Feature:</strong> Briefly describe the feature or module under test.</li>
                <li><strong className="text-blue-600 dark:text-blue-400">b. Objective:</strong> Define the purpose of testing this feature (e.g., ensure correct transaction issuance and acceptance criteria).</li>
                <li><strong className="text-blue-600 dark:text-blue-400">c. Scope:</strong> List what will be covered during testing (modules, projects, existing features affected, and high-level agreements).</li>
                <li><strong className="text-blue-600 dark:text-blue-400">d. End-Users:</strong> List target roles (e.g., Customers, Admin Staff, Agents).</li>
              </ul>
            </div>

            {/* BDD / Gherkin Syntax Section */}
            <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl border border-white/80 dark:border-slate-800 rounded-[28px] p-6 shadow-md space-y-3">
              <h3 className="font-extrabold text-sm text-[#10065F] dark:text-white">
                Test Case in Gherkin Syntax (BDD - Behavior Driven Development)
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Gherkin language is the format used for end-users / non-technical users and technical users to understand test documentation.
              </p>

              <div className="bg-slate-950 text-slate-200 rounded-2xl p-4 font-mono text-xs space-y-2 border border-slate-800">
                <p className="text-amber-400 font-bold">Scenario Outline:</p>
                <p className="pl-4 text-emerald-400"><strong>Given</strong> [pre-condition context]</p>
                <p className="pl-4 text-emerald-400"><strong>When</strong> [user action performed]</p>
                <p className="pl-4 text-emerald-400"><strong>Then</strong> [expected outcome or assertion]</p>
                <p className="pl-4 text-emerald-400"><strong>And</strong> [optional additional condition]</p>
              </div>
            </div>

          </div>
        )}

        {/* TAB 5: PLAYWRIGHT AUTOMATION */}
        {activeTab === 'automation' && (
          <div className="space-y-6">
            <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl border border-white/80 dark:border-slate-800 rounded-[28px] p-6 shadow-xl">
              <h2 className="text-sm font-black uppercase tracking-wider text-[#10065F] dark:text-blue-400 mb-2">
                Playwright End-to-End Testing Setup
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Playwright framework guidelines for end-to-end browser automation across Chromium, Firefox, and WebKit.
              </p>
            </div>

            <div className="bg-slate-950 text-slate-200 rounded-[24px] p-6 border border-slate-800 space-y-4 font-mono text-xs shadow-xl">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <span className="font-bold text-blue-400">1. Setup & Execution Commands</span>
                <button 
                  onClick={() => copyToClipboard('npm init playwright@latest\nnpx playwright test\nnpx playwright show-report', 1)}
                  className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white text-[10px] font-bold rounded-lg cursor-pointer transition-all"
                >
                  {copiedIndex === 1 ? 'Copied!' : 'Copy Commands'}
                </button>
              </div>
              <pre className="text-emerald-400 leading-relaxed">
                # Install Playwright{'\n'}
                npm init playwright@latest{'\n\n'}
                # Execute test suites headless{'\n'}
                npx playwright test{'\n\n'}
                # Run with UI Debugger{'\n'}
                npx playwright test --ui{'\n\n'}
                # View HTML test report{'\n'}
                npx playwright show-report
              </pre>
            </div>

            <div className="bg-slate-950 text-slate-200 rounded-[24px] p-6 border border-slate-800 space-y-4 font-mono text-xs shadow-xl">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <span className="font-bold text-blue-400">2. Sample Test Script (`tests/login.spec.ts`)</span>
                <button 
                  onClick={() => copyToClipboard(samplePlaywrightCode, 2)}
                  className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white text-[10px] font-bold rounded-lg cursor-pointer transition-all"
                >
                  {copiedIndex === 2 ? 'Copied!' : 'Copy Script'}
                </button>
              </div>
              <pre className="text-slate-300 leading-relaxed overflow-x-auto">
                {samplePlaywrightCode}
              </pre>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}