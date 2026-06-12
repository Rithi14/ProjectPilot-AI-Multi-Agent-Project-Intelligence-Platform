import { useState } from "react"

import axios from "axios"

import { useNavigate } from "react-router-dom"



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

        "http://localhost:5000/auth/login",

        formData

      )



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

    <div className="min-h-screen bg-[#050816] flex justify-center items-center text-white">



      <div className="bg-[#111827] p-10 rounded-3xl w-[450px] border border-purple-500">



        {/* ========================= */}
        {/* TITLE */}
        {/* ========================= */}

        <h1 className="text-4xl font-bold text-center text-purple-400 mb-10">

          AI MultiAgent Login

        </h1>



        {/* ========================= */}
        {/* LOGIN TYPE */}
        {/* ========================= */}

        <div className="mb-8">

          <h2 className="text-lg text-gray-300 mb-4 text-center">

            Select Login Type

          </h2>



          <div className="flex gap-4">



            {/* ADMIN BUTTON */}

            <button

              onClick={() => setLoginType("Admin")}

              className={`flex-1 py-4 rounded-xl font-semibold transition-all ${

                loginType === "Admin"

                  ? "bg-purple-600"

                  : "bg-[#1F2937] hover:bg-[#243041]"

              }`}

            >

              Admin

            </button>



            {/* AGENT BUTTON */}

            <button

              onClick={() => setLoginType("Agent")}

              className={`flex-1 py-4 rounded-xl font-semibold transition-all ${

                loginType === "Agent"

                  ? "bg-cyan-600"

                  : "bg-[#1F2937] hover:bg-[#243041]"

              }`}

            >

              Agent

            </button>

          </div>

        </div>



        {/* ========================= */}
        {/* LOGIN FORM */}
        {/* ========================= */}

        <div className="space-y-5">



          {/* EMAIL */}

          <input

            type="email"

            name="email"

            placeholder={`Enter ${loginType} Email`}

            value={formData.email}

            onChange={handleChange}

            className="w-full bg-[#1F2937] p-4 rounded-xl outline-none"

          />



          {/* PASSWORD */}

          <input

            type="password"

            name="password"

            placeholder="Enter Password"

            value={formData.password}

            onChange={handleChange}

            className="w-full bg-[#1F2937] p-4 rounded-xl outline-none"

          />



          {/* ERROR */}

          {

            error && (

              <p className="text-red-400">

                {error}

              </p>

            )

          }



          {/* LOGIN BUTTON */}

          <button

            onClick={loginUser}

            className={`w-full py-4 rounded-xl text-lg font-semibold transition-all ${

              loginType === "Admin"

                ? "bg-purple-600 hover:bg-purple-700"

                : "bg-cyan-600 hover:bg-cyan-700"

            }`}

          >

            Login as {loginType}

          </button>

        </div>

      </div>

    </div>

  )

}



export default Login