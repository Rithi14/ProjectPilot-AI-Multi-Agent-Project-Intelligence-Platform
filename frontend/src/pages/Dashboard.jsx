import { useEffect, useState } from "react"
import axios from "axios"
import AIChat from "./AIChat"
import MultiAgent from "./MultiAgent";
import MeetingHistory from "./MeetingHistory"
import Analytics from "./Analytics"
const API_URL = import.meta.env.VITE_API_URL;

function Dashboard() {

  // =========================
  // STATES
  // =========================
  const [riskData, setRiskData] = useState(null)
  const [projects, setProjects] = useState([])
  const [tasks, setTasks] = useState([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [editingProject, setEditingProject] = useState(null)
const [showPlannerOutput,setShowPlannerOutput] =useState(false)
  const [selectedProject, setSelectedProject] = useState(null)
  const [plannerResult, setPlannerResult] = useState("")
const [developerResult,setDeveloperResult] =useState("")
const [showDeveloperOutput,setShowDeveloperOutput] =useState(false)
  const [showProjectDetails, setShowProjectDetails] = useState(false)
  const [activeMenu, setActiveMenu] = useState("projects")
  const [testerResult,setTesterResult] = useState("")
const [showTesterOutput,setShowTesterOutput] = useState(false)
const [securityResult,setSecurityResult] = useState("")
const [showSecurityOutput,setShowSecurityOutput] = useState(false)
const [documentationResult,setDocumentationResult] = useState("")
const [showDocumentationOutput,setShowDocumentationOutput] = useState(false)
const [costResult, setCostResult] = useState("")
const [showCostOutput, setShowCostOutput] = useState(false)
const [pmResult, setPmResult] = useState("")
const [showPmOutput, setShowPmOutput] =  useState(false)
  // =========================
  // PROJECT FORM
  // =========================

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    deadline: "",
    status: "Active"
  })

  // =========================
  // TASK FORM
  // =========================

  const [taskData, setTaskData] = useState({

    project_id: "",

    task_name: "",

    assigned_to: "",

    priority: "Medium",

    status: "Pending"

  })

  // =========================
  // FETCH PROJECTS
  // =========================

  useEffect(() => {

   axios
  .get(`${API_URL}/projects`)

      .then((res) => {

        setProjects(res.data)

        setLoading(false)

      })

      .catch((err) => {

        console.log(err)

        setError("Failed To Load Projects")

        setLoading(false)

      })

  }, [])

  // =========================
  // FETCH TASKS
  // =========================

  useEffect(() => {

    axios
  .get(`${API_URL}/tasks`)

      .then((res) => {

        setTasks(res.data)

      })

      .catch((err) => {

        console.log(err)

      })

  }, [])

  // =========================
  // HANDLE PROJECT INPUT
  // =========================

  const handleChange = (e) => {

    setFormData({

      ...formData,

      [e.target.name]: e.target.value

    })

  }

  // =========================
  // HANDLE TASK INPUT
  // =========================

  const handleTaskChange = (e) => {

    setTaskData({

      ...taskData,

      [e.target.name]: e.target.value

    })

  }

const createProject = async () => {

  try {

    if (editingProject) {

     await axios.put(
  `${API_URL}/projects/${editingProject.id}`,
  formData
)

      alert("Project Updated")

    } else {

      // Create Project
     // Create Project
const projectRes = await axios.post(
  `${API_URL}/projects`,
  formData
)

const projectId =
  projectRes.data.projectId

console.log(
  "Project ID:",
  projectId
)

      // AI Task Generation
     

      // AI Risk Analysis
   const riskRes = await axios.post(
  `${API_URL}/risk/analyze-risk`,
  {
    title: formData.title,
    description: formData.description,
    deadline: formData.deadline
  }
)
console.log("FULL RISK DATA");
console.log(riskRes.data);

console.log("ANALYSIS FIELD");
console.log(riskRes.data.analysis);
console.log(typeof riskRes.data.analysis);
await axios.put(
  `${API_URL}/risk/save-risk/${projectId}`,
  riskRes.data
);

console.log(
  "Risk Saved:",
  riskRes.data
);

setRiskData(riskRes.data)

console.log(
  "Risk Analysis:",
  riskRes.data
)

      alert(
        "Project Created + AI Tasks Generated + Risk Analyzed"
      )

    }

   const res = await axios.get(
  `${API_URL}/projects`
)

    setProjects(res.data)

    setShowForm(false)

    setEditingProject(null)

    setFormData({

      title: "",
      description: "",
      deadline: "",
      status: "Active"

    })

  } catch (err) {

    console.log(err)

    alert("Operation Failed")

  }

}


  // =========================
  // CREATE TASK
  // =========================

  const createTask = async () => {

    try {

     await axios.post(
  `${API_URL}/tasks`,
  taskData
)

const res = await axios.get(
  `${API_URL}/tasks`
)

      setTasks(res.data)

      alert("Task Created")

      setShowTaskForm(false)

      setTaskData({

        project_id: "",

        task_name: "",

        assigned_to: "",

        priority: "Medium",

        status: "Pending"

      })

    }

    catch (err) {

      console.log(err)

      alert("Failed To Create Task")

    }

  }

  // =========================
  // EDIT PROJECT
  // =========================

  const editProject = (project) => {

    setEditingProject(project)

    setFormData({

      title: project.title,

      description: project.description,

      deadline: project.deadline,

      status: project.status

    })

    setShowForm(true)

  }

  // =========================
  // DELETE PROJECT
  // =========================

  const deleteProject = async (id) => {

    const confirmDelete = window.confirm(
      "Delete This Project?"
    )

    if (!confirmDelete) return

    try {

    await axios.delete(
  `${API_URL}/projects/${id}`
)

const res = await axios.get(
  `${API_URL}/projects`
)

      setProjects(res.data)

      alert("Project Deleted")

    }

    catch (err) {

      console.log(err)

      alert("Delete Failed")

    }

  }

  // =========================
  // VIEW DETAILS
  // =========================

  const openProjectDetails = (project) => {

  setSelectedProject(project)

  setPlannerResult("")

  setShowPlannerOutput(false)

  setShowProjectDetails(true)

}
 const runPlannerAgent = async () => {

  // Already open irundha close pannu

  if (showPlannerOutput) {

    setShowPlannerOutput(false)

    return

  }

  try {

   const res = await axios.post(
  `${API_URL}/agents/planner`,
  {
    projectId: selectedProject.id,
    title: selectedProject.title,
    description: selectedProject.description
  }
)

    setPlannerResult(
      res.data.response
    )

    setShowPlannerOutput(true)

  }

  catch (err) {

    console.log(err)

    alert("Planner Agent Failed")

  }

}
const runDeveloperAgent = async () => {

  if (showDeveloperOutput) {

    setShowDeveloperOutput(false)

    return

  }

  try {

   const res = await axios.post(
  `${API_URL}/agents/developer`,
  {
    projectId: selectedProject.id,
    title: selectedProject.title,
    description: selectedProject.description
  }
)

    setDeveloperResult(
      res.data.response
    )

    setShowDeveloperOutput(true)

  }

  catch (err) {

    console.log(err)

    alert("Developer Agent Failed")

  }

}


const runTesterAgent = async () => {

  // Already open na hide pannidu
  if (showTesterOutput) {

    setShowTesterOutput(false)

    return

  }

  try {

   const res = await axios.post(
  `${API_URL}/agents/tester`,
  {
    projectId: selectedProject.id,
    title: selectedProject.title,
    description: selectedProject.description
  }
)

    setTesterResult(
      res.data.response
    )

    setShowTesterOutput(true)

  }

  catch (err) {

    console.log(err)

    alert("Tester Agent Failed")

  }

}

const runSecurityAgent = async () => {

  if (showSecurityOutput) {

    setShowSecurityOutput(false)

    return

  }

  try {

   const res = await axios.post(
  `${API_URL}/agents/security`,
  {
    projectId: selectedProject.id,
    title: selectedProject.title,
    description: selectedProject.description
  }
)

    setSecurityResult(
      res.data.response
    )

    setShowSecurityOutput(true)

  }

  catch (err) {

    console.log(err)

    alert("Security Agent Failed")

  }

}
const runDocumentationAgent = async () => {

  if (showDocumentationOutput) {

    setShowDocumentationOutput(false)

    return

  }

  try {

   const API_URL = import.meta.env.VITE_API_URL;

const res = await axios.post(
  `${API_URL}/agents/documentation`,
  {
    projectId: selectedProject.id,
    title: selectedProject.title,
    description: selectedProject.description
  }
)

    setDocumentationResult(
      res.data.response
    )

    setShowDocumentationOutput(true)

  }

  catch (err) {

    console.log(err)

    alert("Documentation Agent Failed")

  }

}
const runCostAgent = async () => {

  if (showCostOutput) {

    setShowCostOutput(false)

    return

  }

  try {

    const res = await axios.post(
  `${API_URL}/agents/cost`,
  {
    projectId: selectedProject.id,
    title: selectedProject.title,
    description: selectedProject.description
  }
)

    setCostResult(
      res.data.response
    )

    setShowCostOutput(true)

  }

  catch (err) {

    console.log(err)

    alert("Cost Agent Failed")

  }

}
const runPmAgent = async () => {

  if (showPmOutput) {

    setShowPmOutput(false)

    return

  }

  try {

  

const res = await axios.post(
  `${API_URL}/agents/pm`,
  {
    projectId: selectedProject.id,
    title: selectedProject.title,
    description: selectedProject.description
  }
)

    setPmResult(
      res.data.response
    )

    setShowPmOutput(true)

  }

  catch (err) {

    console.log(err)

    alert(
      "Project Manager Agent Failed"
    )

  }

}

  // =========================
  // UI HELPERS (display-only, no logic changes)
  // =========================

  const statusStyles = {
    Active: "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/30",
    Pending: "bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/30",
    Completed: "bg-sky-500/10 text-sky-400 ring-1 ring-sky-500/30",
    "In Progress": "bg-indigo-500/10 text-indigo-400 ring-1 ring-indigo-500/30",
  }

  const priorityStyles = {
    Low: "bg-slate-500/10 text-slate-300 ring-1 ring-slate-500/30",
    Medium: "bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/30",
    High: "bg-rose-500/10 text-rose-400 ring-1 ring-rose-500/30",
  }

  const agentButtons = [
    { key: "planner", label: "Planner", icon: "🧭", active: showPlannerOutput, onClick: runPlannerAgent, accent: "indigo" },
    { key: "developer", label: "Developer", icon: "💻", active: showDeveloperOutput, onClick: runDeveloperAgent, accent: "emerald" },
    { key: "tester", label: "Tester", icon: "🧪", active: showTesterOutput, onClick: runTesterAgent, accent: "amber" },
    { key: "security", label: "Security", icon: "🔒", active: showSecurityOutput, onClick: runSecurityAgent, accent: "rose" },
    { key: "documentation", label: "Docs", icon: "📄", active: showDocumentationOutput, onClick: runDocumentationAgent, accent: "violet" },
    { key: "cost", label: "Cost", icon: "💰", active: showCostOutput, onClick: runCostAgent, accent: "teal" },
    { key: "pm", label: "PM", icon: "📊", active: showPmOutput, onClick: runPmAgent, accent: "pink" },
  ]

  const accentClasses = {
    indigo: "border-indigo-500/40 text-indigo-300 hover:bg-indigo-500/10",
    emerald: "border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10",
    amber: "border-amber-500/40 text-amber-300 hover:bg-amber-500/10",
    rose: "border-rose-500/40 text-rose-300 hover:bg-rose-500/10",
    violet: "border-violet-500/40 text-violet-300 hover:bg-violet-500/10",
    teal: "border-teal-500/40 text-teal-300 hover:bg-teal-500/10",
    pink: "border-pink-500/40 text-pink-300 hover:bg-pink-500/10",
  }

  const activeAccentClasses = {
    indigo: "bg-indigo-500/15 border-indigo-500 text-indigo-200",
    emerald: "bg-emerald-500/15 border-emerald-500 text-emerald-200",
    amber: "bg-amber-500/15 border-amber-500 text-amber-200",
    rose: "bg-rose-500/15 border-rose-500 text-rose-200",
    violet: "bg-violet-500/15 border-violet-500 text-violet-200",
    teal: "bg-teal-500/15 border-teal-500 text-teal-200",
    pink: "bg-pink-500/15 border-pink-500 text-pink-200",
  }

  const outputPanels = [
    { show: showPlannerOutput, title: "Planner Agent", result: plannerResult, accent: "indigo" },
    { show: showDeveloperOutput, title: "Developer Agent", result: developerResult, accent: "emerald" },
    { show: showTesterOutput, title: "Tester Agent", result: testerResult, accent: "amber" },
    { show: showSecurityOutput, title: "Security Agent", result: securityResult, accent: "rose" },
    { show: showDocumentationOutput, title: "Documentation Agent", result: documentationResult, accent: "violet" },
    { show: showCostOutput, title: "Cost Estimation Agent", result: costResult, accent: "teal" },
    { show: showPmOutput, title: "Project Manager Agent", result: pmResult, accent: "pink" },
  ]

  const panelAccentText = {
    indigo: "text-indigo-300 border-indigo-500/30",
    emerald: "text-emerald-300 border-emerald-500/30",
    amber: "text-amber-300 border-amber-500/30",
    rose: "text-rose-300 border-rose-500/30",
    violet: "text-violet-300 border-violet-500/30",
    teal: "text-teal-300 border-teal-500/30",
    pink: "text-pink-300 border-pink-500/30",
  }

  const navItems = [
    { key: "projects", label: "Projects", icon: "📁" },
    { key: "ai", label: "AI Assistant", icon: "🤖" },
    { key: "multiagent", label: "Multi-Agent", icon: "🤝" },
    { key: "history", label: "Meeting History", icon: "🗂️" },
    { key: "analytics", label: "Analytics", icon: "📊" },
  ]

  return (

    <div className="flex min-h-screen bg-[#0A0E1A] text-slate-200 font-sans antialiased">

      {/* ========================================= */}
      {/* PROJECT FORM */}
      {/* ========================================= */}

      {
        showForm && (

          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">

            <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-[#111528] p-7 shadow-2xl shadow-black/40">

              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-xl font-semibold tracking-tight text-white">
                  {
                    editingProject
                      ? "Update project"
                      : "New project"
                  }
                </h2>
                <span className="rounded-full bg-indigo-500/10 px-2.5 py-1 text-xs font-medium text-indigo-300 ring-1 ring-indigo-500/30">
                  Project
                </span>
              </div>

              <div className="space-y-4">

                <div>
                  <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-500">Title</label>
                  <input
                    type="text"
                    name="title"
                    placeholder="e.g. Customer Portal Revamp"
                    value={formData.title}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-slate-700 bg-[#0D1120] px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-600 outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-500">Description</label>
                  <textarea
                    name="description"
                    placeholder="What is this project about?"
                    value={formData.description}
                    onChange={handleChange}
                    className="h-28 w-full resize-none rounded-lg border border-slate-700 bg-[#0D1120] px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-600 outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-500">Deadline</label>
                    <input
                      type="date"
                      name="deadline"
                      value={formData.deadline}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-slate-700 bg-[#0D1120] px-3.5 py-2.5 text-sm text-slate-100 outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-500">Status</label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-slate-700 bg-[#0D1120] px-3.5 py-2.5 text-sm text-slate-100 outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    >
                      <option>Active</option>
                      <option>Pending</option>
                      <option>Completed</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">

                  <button
                    onClick={createProject}
                    className="flex-1 rounded-lg bg-indigo-600 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-500"
                  >
                    Save project
                  </button>

                  <button
                    onClick={() => setShowForm(false)}
                    className="flex-1 rounded-lg border border-slate-700 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-slate-800"
                  >
                    Cancel
                  </button>

                </div>

              </div>

            </div>

          </div>

        )
      }

      {/* ========================================= */}
      {/* TASK FORM */}
      {/* ========================================= */}

      {
        showTaskForm && (

          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">

            <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-[#111528] p-7 shadow-2xl shadow-black/40">

              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-xl font-semibold tracking-tight text-white">
                  New task
                </h2>
                <span className="rounded-full bg-cyan-500/10 px-2.5 py-1 text-xs font-medium text-cyan-300 ring-1 ring-cyan-500/30">
                  Task
                </span>
              </div>

              <div className="space-y-4">

                <div>
                  <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-500">Project</label>
                  <select
                    name="project_id"
                    value={taskData.project_id}
                    onChange={handleTaskChange}
                    className="w-full rounded-lg border border-slate-700 bg-[#0D1120] px-3.5 py-2.5 text-sm text-slate-100 outline-none transition focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                  >

                    <option value="">
                      Select project
                    </option>

                    {
                      projects.map((project) => (

                        <option
                          key={project.id}
                          value={project.id}
                        >
                          {project.title}
                        </option>

                      ))
                    }

                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-500">Task name</label>
                  <input
                    type="text"
                    name="task_name"
                    placeholder="e.g. Design onboarding flow"
                    value={taskData.task_name}
                    onChange={handleTaskChange}
                    className="w-full rounded-lg border border-slate-700 bg-[#0D1120] px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-600 outline-none transition focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-500">Assigned to</label>
                  <input
                    type="text"
                    name="assigned_to"
                    placeholder="Team member name"
                    value={taskData.assigned_to}
                    onChange={handleTaskChange}
                    className="w-full rounded-lg border border-slate-700 bg-[#0D1120] px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-600 outline-none transition focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-500">Priority</label>
                  <select
                    name="priority"
                    value={taskData.priority}
                    onChange={handleTaskChange}
                    className="w-full rounded-lg border border-slate-700 bg-[#0D1120] px-3.5 py-2.5 text-sm text-slate-100 outline-none transition focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                  >
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                  </select>
                </div>

                <button
                  onClick={createTask}
                  className="w-full rounded-lg bg-cyan-600 py-2.5 text-sm font-medium text-white transition hover:bg-cyan-500"
                >
                  Create task
                </button>

              </div>

            </div>

          </div>

        )
      }

     {/* ========================================= */}
{/* PROJECT DETAILS */}
{/* ========================================= */}

{
  showProjectDetails &&
  selectedProject && (

    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">

      <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-2xl border border-slate-800 bg-[#0D1120] shadow-2xl shadow-black/50">

        {/* HEADER */}
        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-800 bg-[#0D1120]/95 px-8 py-6 backdrop-blur">
          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-wider text-indigo-400">Project overview</p>
            <h1 className="text-2xl font-semibold tracking-tight text-white">
              {selectedProject.title}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">
              {selectedProject.description}
            </p>
          </div>

          <button
            onClick={() => setShowProjectDetails(false)}
            className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-400 transition hover:bg-slate-800 hover:text-white"
          >
            Close
          </button>
        </div>

        <div className="px-8 py-7">

        {/* ========================================= */}
        {/* AI AGENTS */}
        {/* ========================================= */}

        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
          AI agents
        </h2>

        <div className="flex flex-wrap gap-2.5">

          {
            agentButtons.map((agent) => (
              <button
                key={agent.key}
                onClick={agent.onClick}
                className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition ${
                  agent.active ? activeAccentClasses[agent.accent] : `bg-[#111528] ${accentClasses[agent.accent]}`
                }`}
              >
                <span>{agent.icon}</span>
                <span>{agent.label}</span>
                <span className="text-xs opacity-60">{agent.active ? "· hide" : "· run"}</span>
              </button>
            ))
          }

        </div>

              {/* STATS */}

              <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-5">

                <div className="rounded-xl border border-slate-800 bg-[#111528] p-5">
                  <h2 className="text-3xl font-semibold text-white">

                    {
                      tasks.filter(
                        (task) =>
                          Number(task.project_id) === Number(selectedProject.id)
                      ).length
                    }

                  </h2>

                  <p className="mt-1.5 text-xs font-medium uppercase tracking-wide text-slate-500">
                    Total
                  </p>

                </div>

                <div className="rounded-xl border border-slate-800 bg-[#111528] p-5">

                  <h2 className="text-3xl font-semibold text-amber-400">

                    {
                      tasks.filter(
                        (task) =>
                          Number(task.project_id) === Number(selectedProject.id) &&
                          task.status === "Pending"
                      ).length
                    }

                  </h2>

                  <p className="mt-1.5 text-xs font-medium uppercase tracking-wide text-slate-500">
                    Pending
                  </p>

                </div>

                <div className="rounded-xl border border-slate-800 bg-[#111528] p-5">

                  <h2 className="text-3xl font-semibold text-cyan-400">

                    {
                      tasks.filter(
                        (task) =>
                          Number(task.project_id) === Number(selectedProject.id) &&
                          task.status === "In Progress"
                      ).length
                    }

                  </h2>

                  <p className="mt-1.5 text-xs font-medium uppercase tracking-wide text-slate-500">
                    In progress
                  </p>

                </div>

                <div className="rounded-xl border border-slate-800 bg-[#111528] p-5">

                  <h2 className="text-3xl font-semibold text-emerald-400">

                    {
                      tasks.filter(
                        (task) =>
                          Number(task.project_id) === Number(selectedProject.id) &&
                          task.status === "Completed"
                      ).length
                    }

                  </h2>

                  <p className="mt-1.5 text-xs font-medium uppercase tracking-wide text-slate-500">
                    Completed
                  </p>

                </div>

                <div className="rounded-xl border border-slate-800 bg-[#111528] p-5">

                  <h2 className="text-3xl font-semibold text-pink-400">

                    {
                      [
                        ...new Set(

                          tasks
                            .filter(
                              (task) =>
                                Number(task.project_id) === Number(selectedProject.id)
                            )
                            .map(
                              (task) => task.assigned_to
                            )

                        )
                      ].length
                    }

                  </h2>

                  <p className="mt-1.5 text-xs font-medium uppercase tracking-wide text-slate-500">
                    Members
                  </p>

                </div>

              </div>

<div className="mt-8 rounded-xl border border-rose-500/20 bg-[#111528] p-6">

  <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-rose-400">
    <span>⚠</span> AI risk analysis
  </h2>

  <div className="mt-4 flex flex-wrap gap-6">
    <p className="text-sm text-slate-400">
      Risk score
      <span className="ml-2 text-base font-semibold text-amber-400">
        {selectedProject.risk_score}
      </span>
    </p>

    <p className="text-sm text-slate-400">
      Risk level
      <span className="ml-2 text-base font-semibold text-rose-400">
        {selectedProject.risk_level}
      </span>
    </p>
  </div>

 <p className="mt-4 rounded-lg bg-[#0D1120] p-4 text-xs leading-relaxed text-slate-400">
  {JSON.stringify(selectedProject.risk_analysis)}
</p>

</div>

{
  outputPanels.map((panel, idx) => (
    panel.show && (
      <div
        key={idx}
        className={`mt-6 rounded-xl border bg-[#111528] p-6 ${panelAccentText[panel.accent]}`}
      >
        <h2 className={`text-sm font-semibold uppercase tracking-wide ${panelAccentText[panel.accent].split(" ")[0]}`}>
          {panel.title} output
        </h2>

        <pre className="mt-4 whitespace-pre-wrap rounded-lg bg-[#0D1120] p-4 text-sm leading-relaxed text-slate-300">
          {panel.result}
        </pre>
      </div>
    )
  ))
}

              {/* TASKS */}

              <div className="mt-10">

                <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Project tasks
                </h2>

                <div className="space-y-3">

                  {
                    tasks
                      .filter(
                        (task) =>
                          Number(task.project_id) === Number(selectedProject.id)
                      )
                      .map((task) => (

                        <div
                          key={task.id}
                          className="flex items-center justify-between rounded-xl border border-slate-800 bg-[#111528] px-5 py-4"
                        >

                          <div>

                            <h2 className="text-base font-medium text-slate-100">
                              {task.task_name}
                            </h2>

                            <p className="mt-1 text-xs text-slate-500">
                              Assigned to
                              <span className="ml-1.5 text-slate-300">
                                {task.assigned_to}
                              </span>
                            </p>

                          </div>

                          <div className="flex items-center gap-2">

                            <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${priorityStyles[task.priority] || priorityStyles.Medium}`}>
                              {task.priority}
                            </span>

                            <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[task.status] || statusStyles.Pending}`}>
                              {task.status}
                            </span>

                          </div>

                        </div>

                      ))
                  }

                </div>

              </div>

            </div>

          </div>

        </div>

      )
    }

      {/* SIDEBAR */}

     <div className="flex w-72 flex-col border-r border-slate-800 bg-[#0B0F1F] p-6">

        <div className="mb-8 flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">AI</span>
          <h1 className="text-lg font-semibold tracking-tight text-white">
            MultiAgent PM
          </h1>
        </div>

        <button
          onClick={() => setShowForm(true)}
          className="mb-6 w-full rounded-xl bg-indigo-600 py-3 text-sm font-medium text-white transition hover:bg-indigo-500"
        >
          + New project
        </button>

        <nav className="space-y-1.5">
          {
            navItems.map((item) => (
              <button
                key={item.key}
                onClick={() => setActiveMenu(item.key)}
                className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition ${
                  activeMenu === item.key
                    ? "bg-indigo-500/10 text-indigo-300 ring-1 ring-indigo-500/30"
                    : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))
          }
        </nav>

      </div>

      {/* MAIN */}

      <div className="w-full flex-1 p-8">

        <div className="flex items-center justify-between border-b border-slate-800 pb-6">

          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-white">
              Project workspace
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {loading ? "Loading projects…" : error ? error : `${projects.length} project${projects.length === 1 ? "" : "s"} · ${tasks.length} task${tasks.length === 1 ? "" : "s"}`}
            </p>
          </div>

          <button
            onClick={() => setShowTaskForm(true)}
            className="rounded-xl bg-slate-800 px-5 py-3 text-sm font-medium text-slate-200 transition hover:bg-slate-700"
          >
            + Task
          </button>

        </div>

        {/* PROJECT CARDS */}

        {
  activeMenu === "projects" && (

  <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-2">

      {
        projects.map((project) => (

        <div
  key={project.id}
 className="rounded-2xl border border-slate-800 bg-[#111528] p-6 transition hover:border-slate-700"
>

            <div className="flex items-start justify-between">
              <h2 className="text-lg font-semibold tracking-tight text-white">
                {project.title}
              </h2>
              <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[project.status] || statusStyles.Active}`}>
                {project.status}
              </span>
            </div>

            <p className="mt-3 text-sm leading-relaxed text-slate-400">
              {project.description}
            </p>

            <div className="mt-6 flex items-center justify-between border-t border-slate-800 pt-5">

              <p className="text-xs text-slate-500">
                Due {project.deadline}
              </p>

              <div className="flex items-center gap-2">

              <button
  onClick={() => openProjectDetails(project)}
  className="rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-medium text-white transition hover:bg-indigo-500"
>
  View details
</button>

<button
  onClick={() => editProject(project)}
  className="rounded-lg border border-slate-700 px-3.5 py-2 text-xs font-medium text-slate-300 transition hover:bg-slate-800"
>
  Edit
</button>

<button
  onClick={() => deleteProject(project.id)}
  className="rounded-lg border border-rose-500/30 px-3.5 py-2 text-xs font-medium text-rose-400 transition hover:bg-rose-500/10"
>
  Delete
</button>
              </div>

            </div>

          </div>

        ))
      }

    </div>

  )
}

{
  activeMenu === "ai" && (

    <div className="mt-8 w-full">

      <AIChat />

    </div>

  )
}
{
  activeMenu === "multiagent" && (

    <div className="mt-8 w-full">

      <MultiAgent />

    </div>

  )
}
{
  activeMenu === "history" && (

    <div className="mt-8 w-full">

      <MeetingHistory />

    </div>

  )
}
{
  activeMenu === "analytics" && (

    <div className="mt-8 w-full">

      <Analytics />

    </div>

  )
}

      </div>

    </div>

  )

}

export default Dashboard