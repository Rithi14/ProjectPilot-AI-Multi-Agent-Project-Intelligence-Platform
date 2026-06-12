import { useEffect, useState } from "react"
import axios from "axios"
import AIChat from "./AIChat"
import Documents from "./Documents"
import MultiAgent from "./MultiAgent";
import MeetingHistory from "./MeetingHistory"
import Analytics from "./Analytics"
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
      .get("http://localhost:5000/projects")

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
      .get("http://localhost:5000/tasks")

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
        `http://localhost:5000/projects/${editingProject.id}`,
        formData
      )

      alert("Project Updated")

    } else {

      // Create Project
     // Create Project
const projectRes = await axios.post(
  "http://localhost:5000/projects",
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
  "http://localhost:5000/risk/analyze-risk",
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
  `http://localhost:5000/risk/save-risk/${projectId}`,
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
      "http://localhost:5000/projects"
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

        "http://localhost:5000/tasks",

        taskData

      )

      const res = await axios.get(
        "http://localhost:5000/tasks"
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
        `http://localhost:5000/projects/${id}`
      )

      const res = await axios.get(
        "http://localhost:5000/projects"
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
      "http://localhost:5000/agents/planner",
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
      "http://localhost:5000/agents/developer",
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
      "http://localhost:5000/agents/tester",
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
      "http://localhost:5000/agents/security",
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

    const res = await axios.post(
      "http://localhost:5000/agents/documentation",
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
      "http://localhost:5000/agents/cost",
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
      "http://localhost:5000/agents/pm",
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
  return (

    <div className="flex bg-[#050816] text-white min-h-screen">

      {/* ========================================= */}
      {/* PROJECT FORM */}
      {/* ========================================= */}

      {
        showForm && (

          <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-50">

            <div className="bg-[#111827] w-[500px] p-8 rounded-3xl border border-purple-500">

              <h2 className="text-3xl font-bold mb-6">

                {
                  editingProject
                    ? "Update Project"
                    : "Create Project"
                }

              </h2>

              <div className="space-y-4">

                <input
                  type="text"
                  name="title"
                  placeholder="Project Title"
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full bg-[#1F2937] p-4 rounded-xl outline-none"
                />

                <textarea
                  name="description"
                  placeholder="Project Description"
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full bg-[#1F2937] p-4 rounded-xl outline-none h-32"
                />

                <input
                  type="date"
                  name="deadline"
                  value={formData.deadline}
                  onChange={handleChange}
                  className="w-full bg-[#1F2937] p-4 rounded-xl outline-none"
                />

                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full bg-[#1F2937] p-4 rounded-xl outline-none"
                >
                  <option>Active</option>
                  <option>Pending</option>
                  <option>Completed</option>
                </select>

                <div className="flex gap-4 pt-4">

                  <button
                    onClick={createProject}
                    className="flex-1 bg-purple-600 hover:bg-purple-700 py-3 rounded-xl"
                  >
                    Save
                  </button>

                  <button
                    onClick={() => setShowForm(false)}
                    className="flex-1 bg-red-500 hover:bg-red-600 py-3 rounded-xl"
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

          <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-50">

            <div className="bg-[#111827] w-[500px] p-8 rounded-3xl border border-cyan-500">

              <h2 className="text-3xl font-bold mb-6">
                Create Task
              </h2>

              <div className="space-y-4">

                <select
                  name="project_id"
                  value={taskData.project_id}
                  onChange={handleTaskChange}
                  className="w-full bg-[#1F2937] p-4 rounded-xl outline-none"
                >

                  <option value="">
                    Select Project
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

                <input
                  type="text"
                  name="task_name"
                  placeholder="Task Name"
                  value={taskData.task_name}
                  onChange={handleTaskChange}
                  className="w-full bg-[#1F2937] p-4 rounded-xl outline-none"
                />

                <input
                  type="text"
                  name="assigned_to"
                  placeholder="Assigned To"
                  value={taskData.assigned_to}
                  onChange={handleTaskChange}
                  className="w-full bg-[#1F2937] p-4 rounded-xl outline-none"
                />

                <select
                  name="priority"
                  value={taskData.priority}
                  onChange={handleTaskChange}
                  className="w-full bg-[#1F2937] p-4 rounded-xl outline-none"
                >
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                </select>

                <button
                  onClick={createTask}
                  className="w-full bg-cyan-600 hover:bg-cyan-700 py-3 rounded-xl"
                >
                  Create Task
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

    <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-50">

      <div className="bg-[#111827] w-[950px] max-h-[90vh] overflow-y-auto p-8 rounded-3xl border border-purple-500">

        {/* ========================================= */}
        {/* PROJECT TITLE */}
        {/* ========================================= */}

        <h1 className="text-4xl font-bold text-purple-400">
          {selectedProject.title}
        </h1>

        <p className="text-gray-400 mt-3">
          {selectedProject.description}
        </p>

        {/* ========================================= */}
        {/* AI AGENTS */}
        {/* ========================================= */}

        <h2 className="text-xl font-semibold text-white mt-8 mb-4">
          AI Agents
        </h2>

        <div className="flex flex-wrap gap-3">

          <button
            onClick={runPlannerAgent}
            className="bg-cyan-600 hover:bg-cyan-700 px-5 py-2 rounded-xl"
          >
            {
              showPlannerOutput
                ? "❌ Hide Planner"
                : "🤖 Planner Agent"
            }
          </button>

          <button
            onClick={runDeveloperAgent}
            className="bg-green-600 hover:bg-green-700 px-5 py-2 rounded-xl"
          >
            {
              showDeveloperOutput
                ? "❌ Hide Developer"
                : "💻 Developer Agent"
            }
          </button>

          <button
            onClick={runTesterAgent}
            className="bg-yellow-600 hover:bg-yellow-700 px-5 py-2 rounded-xl"
          >
            {
              showTesterOutput
                ? "❌ Hide Tester"
                : "🧪 Tester Agent"
            }
          </button>

          <button
            onClick={runSecurityAgent}
            className="bg-red-600 hover:bg-red-700 px-5 py-2 rounded-xl"
          >
            {
              showSecurityOutput
                ? "❌ Hide Security"
                : "🔒 Security Agent"
            }
          </button>

          <button
            onClick={runDocumentationAgent}
            className="bg-indigo-600 hover:bg-indigo-700 px-5 py-2 rounded-xl"
          >
            {
              showDocumentationOutput
                ? "❌ Hide Docs"
                : "📄 Documentation Agent"
            }
          </button>
          <button
  onClick={runCostAgent}
  className="bg-emerald-600 hover:bg-emerald-700 px-5 py-2 rounded-xl"
>
  {
    showCostOutput
      ? "❌ Hide Cost"
      : "💰 Cost Agent"
  }
</button>
<button
  onClick={runPmAgent}
  className="bg-pink-600 hover:bg-pink-700 px-5 py-2 rounded-xl"
>
  {
    showPmOutput
      ? "❌ Hide PM"
      : "📊 PM Agent"
  }
</button>

          <button
            onClick={() => setShowProjectDetails(false)}
            className="bg-red-500 hover:bg-red-600 px-5 py-2 rounded-xl"
          >
            CLOSE
          </button>

        </div>

  

              {/* STATS */}

              <div className="grid grid-cols-5 gap-5 mt-10">

                <div className="bg-[#1F2937] p-5 rounded-2xl">
                  <h2 className="text-4xl font-bold text-purple-400">

                    {
                      tasks.filter(
                        (task) =>
                          Number(task.project_id) === Number(selectedProject.id)
                      ).length
                    }

                  </h2>

                  <p className="text-gray-400 mt-2">
                    Total
                  </p>

                </div>

                <div className="bg-[#1F2937] p-5 rounded-2xl">

                  <h2 className="text-4xl font-bold text-yellow-400">

                    {
                      tasks.filter(
                        (task) =>
                          Number(task.project_id) === Number(selectedProject.id) &&
                          task.status === "Pending"
                      ).length
                    }

                  </h2>

                  <p className="text-gray-400 mt-2">
                    Pending
                  </p>

                </div>

                <div className="bg-[#1F2937] p-5 rounded-2xl">

                  <h2 className="text-4xl font-bold text-cyan-400">

                    {
                      tasks.filter(
                        (task) =>
                          Number(task.project_id) === Number(selectedProject.id) &&
                          task.status === "In Progress"
                      ).length
                    }

                  </h2>

                  <p className="text-gray-400 mt-2">
                    In Progress
                  </p>

                </div>

                <div className="bg-[#1F2937] p-5 rounded-2xl">

                  <h2 className="text-4xl font-bold text-green-400">

                    {
                      tasks.filter(
                        (task) =>
                          Number(task.project_id) === Number(selectedProject.id) &&
                          task.status === "Completed"
                      ).length
                    }

                  </h2>

                  <p className="text-gray-400 mt-2">
                    Completed
                  </p>

                </div>

                <div className="bg-[#1F2937] p-5 rounded-2xl">

                  <h2 className="text-4xl font-bold text-pink-400">

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

                  <p className="text-gray-400 mt-2">
                    Members
                  </p>

                </div>

              </div>
<div className="bg-[#1F2937] p-6 rounded-2xl mt-8 border border-red-500">

  <h2 className="text-2xl font-bold text-red-400">
    AI Risk Analysis
  </h2>

  <p className="mt-4">
    Risk Score:
    <span className="text-yellow-400 ml-2">
      {selectedProject.risk_score}
    </span>
  </p>

  <p className="mt-2">
    Risk Level:
    <span className="text-red-400 ml-2">
      {selectedProject.risk_level}
    </span>
  </p>

 <p className="mt-4 text-gray-300">
  {JSON.stringify(selectedProject.risk_analysis)}
</p>

</div>




{
  showPlannerOutput && (

    <div className="bg-[#1F2937] p-6 rounded-2xl mt-8 border border-cyan-500">

      <h2 className="text-2xl font-bold text-cyan-400">
        Planner Agent Output
      </h2>

      <pre className="mt-4 whitespace-pre-wrap text-gray-300">
        {plannerResult}
      </pre>

    </div>

  )
}





{
  showDeveloperOutput && (

    <div className="bg-[#1F2937] p-6 rounded-2xl mt-8 border border-green-500">

      <h2 className="text-2xl font-bold text-green-400">
        Developer Agent Output
      </h2>

      <pre className="mt-4 whitespace-pre-wrap text-white">
        {developerResult}
      </pre>

    </div>

  )
}


{showTesterOutput && (

  <div className="bg-[#1F2937] p-6 rounded-2xl mt-8 border border-yellow-500">

    <h2 className="text-2xl font-bold text-yellow-400">
      Tester Agent Output
    </h2>

    <pre className="mt-4 whitespace-pre-wrap">
      {testerResult}
    </pre>

  </div>

)}



{showSecurityOutput && (

  <div className="bg-[#1F2937] p-6 rounded-2xl mt-8 border border-red-500">

    <h2 className="text-2xl font-bold text-red-400">
      Security Agent Output
    </h2>

    <pre className="mt-4 whitespace-pre-wrap">
      {securityResult}
    </pre>

  </div>

)}

{showDocumentationOutput && (

  <div className="bg-[#1F2937] p-6 rounded-2xl mt-8 border border-indigo-500">

    <h2 className="text-2xl font-bold text-indigo-400">
      Documentation Agent Output
    </h2>

    <pre className="mt-4 whitespace-pre-wrap">
      {documentationResult}
    </pre>

  </div>

)}

{
  showCostOutput && (

    <div className="bg-[#1F2937] p-6 rounded-2xl mt-8 border border-emerald-500">

      <h2 className="text-2xl font-bold text-emerald-400">
        Cost Estimation Agent Output
      </h2>

      <pre className="mt-4 whitespace-pre-wrap">
        {costResult}
      </pre>

    </div>

  )
}  
{
  showPmOutput && (

    <div className="bg-[#1F2937] p-6 rounded-2xl mt-8 border border-pink-500">

      <h2 className="text-2xl font-bold text-pink-400">
        Project Manager Agent Output
      </h2>

      <pre className="mt-4 whitespace-pre-wrap">
        {pmResult}
      </pre>

    </div>

  )
}
              {/* TASKS */}

              <div className="mt-10">

                <h2 className="text-3xl font-bold mb-6">
                  Project Tasks
                </h2>

                <div className="space-y-4">

                  {
                    tasks
                      .filter(
                        (task) =>
                          Number(task.project_id) === Number(selectedProject.id)
                      )
                      .map((task) => (

                        <div
                          key={task.id}
                          className="bg-[#1F2937] p-5 rounded-2xl border border-cyan-500"
                        >

                          <div className="flex justify-between items-center">

                            <div>

                              <h2 className="text-2xl font-bold text-cyan-400">
                                {task.task_name}
                              </h2>

                              <p className="text-gray-400 mt-3">
                                Assigned To :
                                <span className="text-white ml-2">
                                  {task.assigned_to}
                                </span>
                              </p>

                            </div>

                            <div className="text-right">

                              <p className="text-yellow-400">
                                {task.priority}
                              </p>

                              <p className="text-green-400 mt-2">
                                {task.status}
                              </p>

                            </div>

                          </div>

                        </div>

                      ))
                  }

                </div>

              </div>

            </div>

          </div>

        )
      }

      {/* SIDEBAR */}

     <div className="w-80 bg-[#0B1023] border-r border-gray-800 p-6">

        <h1 className="text-3xl font-bold text-purple-500">
          AI MultiAgent PM
        </h1>

        <button
          onClick={() => setShowForm(true)}
          className="w-full bg-purple-600 hover:bg-purple-700 py-4 rounded-2xl mt-10"
        >
          + New Project
        </button>
        <button
  onClick={() => setActiveMenu("projects")}
  className="w-full bg-[#1F2937] hover:bg-[#374151] py-4 rounded-2xl mt-4"
>
  📁 Projects
</button>

<button
  onClick={() => setActiveMenu("ai")}
  className="w-full bg-[#1F2937] hover:bg-[#374151] py-4 rounded-2xl mt-4"
>
  🤖 AI Assistant
</button>
<button
  onClick={() => setActiveMenu("rag")}
  className="w-full bg-[#1F2937] hover:bg-[#374151] py-4 rounded-2xl mt-4"
>
  📚 Knowledge Base
</button>
<button
  onClick={() => setActiveMenu("multiagent")}
  className="w-full bg-[#1F2937] hover:bg-[#374151] py-4 rounded-2xl mt-4"
>
  🤝 Multi-Agent
</button>
<button
  onClick={() => setActiveMenu("history")}
  className="w-full bg-[#1F2937] hover:bg-[#374151] py-4 rounded-2xl mt-4"
>
  📋 Meeting History
</button>
<button
  onClick={() => setActiveMenu("analytics")}
  className="w-full bg-[#1F2937] hover:bg-[#374151] py-4 rounded-2xl mt-4"
>
  📊 Analytics
</button>

      </div>

      {/* MAIN */}

      <div className="flex-1 w-full p-8">

        <div className="flex justify-between items-center">

          <h1 className="text-4xl font-bold">
            AI Multi-Agent Project Manager
          </h1>

          <button
            onClick={() => setShowTaskForm(true)}
            className="bg-purple-600 hover:bg-purple-700 px-8 py-4 rounded-2xl"
          >
            + Task
          </button>

        </div>

        {/* PROJECT CARDS */}
<div className="flex flex-wrap gap-8 mt-10">

        {
  activeMenu === "projects" && (

  <div className="flex flex-wrap gap-8 mt-10">

      {
        projects.map((project) => (

        <div
  key={project.id}
 className="bg-[#111827] border border-purple-500 p-6 rounded-2xl min-w-[500px]"
>

            <h2 className="text-3xl font-bold text-purple-400">
              {project.title}
            </h2>

            <p className="text-gray-400 mt-4">
              {project.description}
            </p>

            <div className="flex justify-between items-center mt-8">

              <div>

                <p className="text-cyan-400">
                  {project.status}
                </p>

                <p className="text-gray-500 mt-2 text-sm">
                  {project.deadline}
                </p>

              </div>
              <div className="flex gap-3 items-center">

              <button
  onClick={() => openProjectDetails(project)}
  className="bg-purple-600 hover:bg-purple-700 px-4 py-3 rounded-xl whitespace-nowrap"
>
  View Details
</button>

<button
  onClick={() => editProject(project)}
  className="bg-yellow-500 hover:bg-yellow-600 px-4 py-3 rounded-xl whitespace-nowrap"
>
  Edit
</button>

<button
  onClick={() => deleteProject(project.id)}
  className="bg-red-500 hover:bg-red-600 px-4 py-3 rounded-xl whitespace-nowrap"
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

    <div className="w-full mt-10">

      <AIChat />

    </div>

  )
}
{
  activeMenu === "rag" && (

    <div className="w-full mt-10">

      <Documents />

    </div>

  )
}
{
  activeMenu === "multiagent" && (

    <div className="w-full mt-10">

      <MultiAgent />

    </div>

  )
}
{
  activeMenu === "history" && (

    <div className="w-full mt-10">

      <MeetingHistory />

    </div>

  )
}
{
  activeMenu === "analytics" && (

    <div className="w-full mt-10">

      <Analytics />

    </div>

  )
}

        </div>

      </div>

    </div>

  )

}

export default Dashboard