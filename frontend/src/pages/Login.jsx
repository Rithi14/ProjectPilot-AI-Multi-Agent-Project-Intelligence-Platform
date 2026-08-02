import { useState } from "react"

import axios from "axios"

import { useNavigate } from "react-router-dom"

const API_URL = import.meta.env.VITE_API_URL;

function Login() {

  const navigate = useNavigate()



  // =========================
  // STATES
  // =========================

  const [formData, setFormData] = useState({

    email: "",

    password: ""

  })



  const [error, setError] = useState("")



  const [loginType, setLoginType] = useState("Admin")



  // =========================
  // HANDLE INPUT
  // =========================

  const handleChange = (e) => {

    setFormData({

      ...formData,

      [e.target.name]: e.target.value

    })

  }



  // =========================
  // LOGIN USER
  // =========================

  const loginUser = async () => {

    try {

     const res = await axios.post(
  `${API_URL}/auth/login`,
  formData
);



      // =========================
      // ROLE VALIDATION
      // =========================

      if (

        loginType === "Admin" &&

        res.data.role_type !== "Admin"

      ) {

        setError("This account is not Admin")

        return

      }



      if (

        loginType === "Agent" &&

        res.data.role_type === "Admin"

      ) {

        setError("This account is not Agent")

        return

      }



      // =========================
      // SAVE USER
      // =========================

      localStorage.setItem(

        "user",

        JSON.stringify(res.data)

      )



      localStorage.setItem(

        "loginType",

        loginType

      )



      // =========================
      // SUCCESS
      // =========================

      alert("Login Success")



      // =========================
      // NAVIGATION
      // =========================

      if (res.data.role_type === "Admin") {

        navigate("/admin-dashboard")

      }

      else {

        navigate("/agent-dashboard")

      }

    }

    catch (err) {

      console.log(err)

      setError("Invalid Email or Password")

    }

  }



  return (

    <div className="flex min-h-screen bg-[#0A0E1A] text-slate-200">

      {/* ========================= */}
      {/* BRAND PANEL */}
      {/* ========================= */}

      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-[#0D1120] p-12 lg:flex">

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(99,102,241,0.12),transparent_45%),radial-gradient(circle_at_80%_75%,rgba(56,189,248,0.10),transparent_45%)]" />

        <div className="relative flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">AI</span>
          <span className="text-lg font-semibold tracking-tight text-white">MultiAgent PM</span>
        </div>

        <div className="relative max-w-md">
          <p className="mb-3 text-xs font-medium uppercase tracking-wider text-indigo-400">
            Enterprise workspace
          </p>
          <h1 className="text-4xl font-semibold leading-tight tracking-tight text-white">
            Coordinate every project, agent, and decision in one place.
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-slate-400">
            Sign in to manage projects, review AI agent output, and track delivery risk across your organization.
          </p>

          <div className="mt-8 space-y-3 text-sm text-slate-400">
            <div className="flex items-center gap-2.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Real-time risk and progress analytics
            </div>
            <div className="flex items-center gap-2.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Role-based access for admins and agents
            </div>
            <div className="flex items-center gap-2.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              AI agents for planning, testing, and security
            </div>
          </div>
        </div>

        <p className="relative text-xs text-slate-600">
          © {new Date().getFullYear()} AI MultiAgent PM. All rights reserved.
        </p>

      </div>

      {/* ========================= */}
      {/* LOGIN FORM */}
      {/* ========================= */}

      <div className="flex w-full flex-col items-center justify-center px-6 py-12 lg:w-1/2">

        <div className="w-full max-w-sm">

          <div className="mb-8 lg:hidden">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">AI</span>
              <span className="text-lg font-semibold tracking-tight text-white">MultiAgent PM</span>
            </div>
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-white">
            Sign in to your account
          </h1>
          <p className="mt-1.5 text-sm text-slate-500">
            Enter your credentials to access the dashboard
          </p>

          {/* ========================= */}
          {/* LOGIN TYPE */}
          {/* ========================= */}

          <div className="mt-8">

            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
              Account type
            </p>

            <div className="grid grid-cols-2 gap-1 rounded-xl border border-slate-800 bg-[#111528] p-1">

              {/* ADMIN BUTTON */}

              <button

                onClick={() => setLoginType("Admin")}

                className={`rounded-lg py-2.5 text-sm font-medium transition-all ${

                  loginType === "Admin"

                    ? "bg-indigo-600 text-white shadow-sm"

                    : "text-slate-400 hover:text-slate-200"

                }`}

              >

                Admin

              </button>

              {/* AGENT BUTTON */}

              <button

                onClick={() => setLoginType("Agent")}

                className={`rounded-lg py-2.5 text-sm font-medium transition-all ${

                  loginType === "Agent"

                    ? "bg-cyan-600 text-white shadow-sm"

                    : "text-slate-400 hover:text-slate-200"

                }`}

              >

                Agent

              </button>

            </div>

          </div>

          {/* ========================= */}
          {/* LOGIN FORM */}
          {/* ========================= */}

          <div className="mt-6 space-y-4">

            {/* EMAIL */}

            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-500">
                Email
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-slate-500">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>
                </span>
                <input

                  type="email"

                  name="email"

                  placeholder={`${loginType.toLowerCase()}@company.com`}

                  value={formData.email}

                  onChange={handleChange}

                  className="w-full rounded-lg border border-slate-700 bg-[#111528] py-2.5 pl-10 pr-3.5 text-sm text-slate-100 placeholder-slate-600 outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"

                />
              </div>
            </div>

            {/* PASSWORD */}

            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-500">
                Password
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-slate-500">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="4" y="10" width="16" height="10" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></svg>
                </span>
                <input

                  type="password"

                  name="password"

                  placeholder="Enter password"

                  value={formData.password}

                  onChange={handleChange}

                  className="w-full rounded-lg border border-slate-700 bg-[#111528] py-2.5 pl-10 pr-3.5 text-sm text-slate-100 placeholder-slate-600 outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"

                />
              </div>
            </div>

            {/* ERROR */}

            {

              error && (

                <div className="flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3.5 py-2.5 text-sm text-rose-400">
                  <span>⚠</span>
                  {error}
                </div>

              )

            }

            {/* LOGIN BUTTON */}

            <button

              onClick={loginUser}

              className={`w-full rounded-lg py-3 text-sm font-medium text-white shadow-sm transition-all ${

                loginType === "Admin"

                  ? "bg-indigo-600 hover:bg-indigo-500"

                  : "bg-cyan-600 hover:bg-cyan-500"

              }`}

            >

              Sign in as {loginType}

            </button>

          </div>

          <p className="mt-8 text-center text-xs text-slate-600">
            Protected access · Contact your administrator for account issues
          </p>

        </div>

      </div>

    </div>

  )

}



export default Login