
const API = "http://127.0.0.1:5000/api";

const auth = {
  save(data) {
    localStorage.setItem("token", data.access_token);
    localStorage.setItem("user", JSON.stringify(data.user));
  },
  getToken() {
    return localStorage.getItem("token");
  },
  getUser() {
    return JSON.parse(localStorage.getItem("user"));
  },
  clear() {
    localStorage.clear();
  },
  isLoggedIn() {
    return localStorage.getItem("token") !== null;
  }
};

const Login = {
  template: `
    <div class="auth-wrapper">
      <div class="auth-card">
        <h4 class="mb-3">Sign In</h4>
        <form @submit.prevent="handleLogin">
          <div class="mb-3">
            <label class="form-label">Email</label>
            <input v-model="email" type="email" class="form-control" required />
          </div>
          <div class="mb-3">
            <label class="form-label">Password</label>
            <input v-model="password" type="password" class="form-control" required />
          </div>
          <div v-if="error" class="alert alert-danger py-2">{{ error }}</div>
          <button type="submit" class="btn btn-primary w-100 mb-3">Login</button>
        </form>
        <div class="text-center small">
          Register: 
          <a href="#/register-student" class="text-info">Student</a> | 
          <a href="#/register-company" class="text-info">Company</a>
        </div>
      </div>
    </div>
  `,
  data() {
    return {
      email: "",
      password: "",
      error: ""
    };
  },
  methods: {
    async handleLogin() {
      this.error = "";
      try {
        const response = await fetch(API + "/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: this.email, password: this.password })
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Login failed");
        }
        auth.save(data);
        this.$router.push("/" + data.user.role + "/dashboard");
      } catch (err) {
        this.error = err.message;
      }
    }
  }
};

const RegisterStudent = {
  template: `
    <div class="auth-wrapper">
      <div class="auth-card">
        <h4 class="mb-3">Student Registration</h4>
        <form @submit.prevent="handleRegister">
          <div class="mb-3">
            <label class="form-label">Name</label>
            <input v-model="name" class="form-control" required />
          </div>
          <div class="mb-3">
            <label class="form-label">Email</label>
            <input v-model="email" type="email" class="form-control" required />
          </div>
          <div class="mb-3">
            <label class="form-label">Password</label>
            <input v-model="password" type="password" class="form-control" required />
          </div>
          <div v-if="error" class="alert alert-danger py-2">{{ error }}</div>
          <div v-if="success" class="alert alert-success py-2">{{ success }}</div>
          <button type="submit" class="btn btn-primary w-100">Register</button>
        </form>
        <div class="text-center mt-3 small"><a href="#/login" class="text-info">Back to Login</a></div>
      </div>
    </div>
  `,
  data() {
    return {
      name: "",
      email: "",
      password: "",
      error: "",
      success: ""
    };
  },
  methods: {
    async handleRegister() {
      this.error = "";
      this.success = "";
      try {
        const response = await fetch(API + "/auth/register/student", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: this.name, email: this.email, password: this.password })
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Registration failed");
        }
        this.success = data.message + " Redirecting to login...";
        setTimeout(() => this.$router.push("/login"), 2000);
      } catch (err) {
        this.error = err.message;
      }
    }
  }
};

const RegisterCompany = {
  template: `
    <div class="auth-wrapper">
      <div class="auth-card">
        <h4 class="mb-3">Company Registration</h4>
        <form @submit.prevent="handleRegister">
          <div class="mb-3">
            <label class="form-label">Contact Name</label>
            <input v-model="name" class="form-control" required />
          </div>
          <div class="mb-3">
            <label class="form-label">Company Name</label>
            <input v-model="company_name" class="form-control" required />
          </div>
          <div class="mb-3">
            <label class="form-label">Email</label>
            <input v-model="email" type="email" class="form-control" required />
          </div>
          <div class="mb-3">
            <label class="form-label">Password</label>
            <input v-model="password" type="password" class="form-control" required />
          </div>
          <div v-if="error" class="alert alert-danger py-2">{{ error }}</div>
          <div v-if="success" class="alert alert-success py-2">{{ success }}</div>
          <button type="submit" class="btn btn-primary w-100">Register</button>
        </form>
        <div class="text-center mt-3 small"><a href="#/login" class="text-info">Back to Login</a></div>
      </div>
    </div>
  `,
  data() {
    return {
      name: "",
      company_name: "",
      email: "",
      password: "",
      error: "",
      success: ""
    };
  },
  methods: {
    async handleRegister() {
      this.error = "";
      this.success = "";
      try {
        const response = await fetch(API + "/auth/register/company", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: this.name,
            company_name: this.company_name,
            email: this.email,
            password: this.password
          })
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Registration failed");
        }
        this.success = data.message;
        setTimeout(() => this.$router.push("/login"), 3000);
      } catch (err) {
        this.error = err.message;
      }
    }
  }
};

const DashboardLayout = {
  props: ["title"],
  template: `
    <div class="container py-4">
      <div class="d-flex justify-content-between align-items-center border-bottom pb-2 mb-4">
        <h3>{{ title }}</h3>
        <div>
          <span class="me-3">Hello, {{ user.name }} ({{ user.role }})</span>
          <button @click="logout" class="btn btn-sm btn-outline-danger">Logout</button>
        </div>
      </div>
      <slot></slot>
    </div>
  `,
  data() {
    return {
      user: auth.getUser()
    };
  },
  methods: {
    logout() {
      auth.clear();
      this.$router.push("/login");
    }
  }
};


const AdminDashboard = {
  components: { DashboardLayout },
  template: `<DashboardLayout title="Admin Panel"><p>Admin features will be added here.</p></DashboardLayout>`
};

const CompanyDashboard = {
  components: { DashboardLayout },
  template: `<DashboardLayout title="Company Panel"><p>Company dashboard features will be added here.</p></DashboardLayout>`
};

const StudentDashboard = {
  components: { DashboardLayout },
  template: `<DashboardLayout title="Student Panel"><p>Student dashboard features will be added here.</p></DashboardLayout>`
};


const routes = [
  { path: "/", redirect: "/login" },
  { path: "/login", component: Login },
  { path: "/register-student", component: RegisterStudent },
  { path: "/register-company", component: RegisterCompany },
  { path: "/admin/dashboard", component: AdminDashboard, meta: { role: "admin" } },
  { path: "/company/dashboard", component: CompanyDashboard, meta: { role: "company" } },
  { path: "/student/dashboard", component: StudentDashboard, meta: { role: "student" } }
];

const router = VueRouter.createRouter({
  history: VueRouter.createWebHashHistory(),
  routes
});


router.beforeEach((to, from, next) => {
  if (to.meta.role) {
    if (!auth.isLoggedIn()) {
      return next("/login");
    }
    const user = auth.getUser();
    if (user.role !== to.meta.role) {
      return next("/" + user.role + "/dashboard");
    }
  }
  next();
});


Vue.createApp({}).use(router).mount("#app");
