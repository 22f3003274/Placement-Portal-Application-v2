const AdminDashboard = {
  components: { DashboardLayout },

  template: `
    <DashboardLayout title="Admin Dashboard">

      <button @click="tab = 'stats'">Stats</button>
      <button @click="tab = 'students'">Students</button>
      <button @click="tab = 'companies'">Companies</button>
      <button @click="tab = 'drives'">Drives</button>
      <button @click="tab = 'applications'">Applications</button>

      <hr>

      <div v-if="tab === 'stats'">
        <h3>Statistics</h3>

        <p>Students: {{ stats.students }}</p>
        <p>Companies: {{ stats.companies }}</p>
        <p>Drives: {{ stats.drives }}</p>
        <p>Applications: {{ stats.applications }}</p>

      </div>


      <div v-if="tab === 'students'">
        <h3>Students</h3>

        <input v-model="studentSearch" placeholder="Search student" >
        <button @click="getStudents">Search</button>
        <br><br>

        <table border="1">
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Roll Number</th>
            <th>Status</th>
            <th>Action</th>
          </tr>

          <tr v-for="student in students" :key="student.id">
            <td>{{ student.name }}</td>
            <td>{{ student.email }}</td>
            <td>{{ student.roll_number }}</td>

            <td>
              {{ student.is_blacklisted ? "Blacklisted" : "Active" }}
            </td>

            <td>
              <button @click="blacklist(student.id)">
                {{ student.is_blacklisted ? 'Unblacklist' : 'Blacklist' }}
              </button>
            </td>

          </tr>
        </table>
      </div>


      <div v-if="tab === 'companies'"> 
        <h3>Companies</h3>

        <input v-model="companySearch" placeholder="Search company">
        <button @click="getCompanies">Search</button>
        <br><br>

        <table border="1">
          <tr>
            <th>Company</th>
            <th>Website</th>
            <th>Approval</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>

          <tr v-for="company in companies" :key="company.id">
            <td>{{ company.company_name }}</td>
            <td>{{ company.website }}</td>
            <td>{{ company.approval_status }}</td>

            <td>
              {{ company.is_blacklisted ? "Blacklisted" : "Active" }}
            </td>

            <td>
              <button v-if="company.approval_status !== 'approved'" @click="changeCompanyStatus(company.id, 'approved')"> Approve </button>
              <button v-else disabled> Approved </button>

              <button v-if="company.approval_status !== 'rejected'" @click="changeCompanyStatus(company.id, 'rejected')"> Reject </button>
              <button v-else disabled> Rejected </button>

              <button @click="blacklist(company.user_id)">
                {{ company.is_blacklisted ? 'Unblacklist' : 'Blacklist' }}
              </button>
            </td>

          </tr>
        </table>
      </div>


      <div v-if="tab === 'drives'">
        <h3>Placement Drives</h3>

        <table border="1">
          <tr>
            <th>Company</th>
            <th>Job Title</th>
            <th>Salary</th>
            <th>Deadline</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>

          <tr v-for="drive in drives" :key="drive.id">

            <td>{{ drive.company_name }}</td>
            <td>{{ drive.job_title }}</td>
            <td>{{ drive.salary_lpa }}</td>
            <td>{{ drive.application_deadline }}</td>
            <td>{{ drive.status }}</td>

            <td>
              <button v-if="drive.status !== 'approved'" @click="changeDriveStatus(drive.id, 'approved')"> Approve </button>
              <button v-else disabled> Approved </button>

              <button v-if="drive.status !== 'rejected'" @click="changeDriveStatus(drive.id, 'rejected')"> Reject </button>
              <button v-else disabled> Rejected </button>

              <button v-if="drive.status !== 'closed'" @click="changeDriveStatus(drive.id, 'closed')"> Close </button>
              <button v-else disabled> Closed </button>
            </td>

          </tr>
        </table>
      </div>


      <div v-if="tab === 'applications'">
        <h3>Applications</h3>

        <table border="1">
          <tr>
            <th>Student</th>
            <th>Company</th>
            <th>Job</th>
            <th>Status</th>
            <th>Applied At</th>
          </tr>

          <tr v-for="application in applications" :key="application.id">
            <td>{{ application.student_name }}</td>
            <td>{{ application.company_name }}</td>
            <td>{{ application.job_title }}</td>
            <td>{{ application.status }}</td>
            <td>{{ application.applied_at }}</td>

          </tr>

        </table>
      </div>
    </DashboardLayout>
  `,

  data() {
    return {
      tab: "stats",

      stats: {},
      students: [],
      companies: [],
      drives: [],
      applications: [],
      studentSearch: "",
      companySearch: ""
    };
  },

  methods: {
    async getStats() {
      const response = await fetch(API + "/admin/stats", {
        headers: { Authorization: "Bearer " + localStorage.getItem("token") }
      });
      this.stats = await response.json();
    },


    async getStudents() {
      const response = await fetch(
        API + "/admin/students?search=" + this.studentSearch,
        {
          headers: { Authorization: "Bearer " + localStorage.getItem("token") }
        }
      );

      this.students = await response.json();
    },


    async getCompanies() {
      const response = await fetch(
        API + "/admin/companies?search=" + this.companySearch,
        {
          headers: { Authorization: "Bearer " + localStorage.getItem("token") }
        }
      );

      this.companies = await response.json();
    },


    async getDrives() {
      const response = await fetch(API + "/admin/drives", {
        headers: { Authorization: "Bearer " + localStorage.getItem("token") }
      });
      this.drives = await response.json();
    },


    async getApplications() {
      const response = await fetch(API + "/admin/applications", {
        headers: { Authorization: "Bearer " + localStorage.getItem("token") }
      });

      this.applications = await response.json();
    },


    async blacklist(userId) {
      await fetch(
        API + "/admin/users/" + userId + "/toggle-blacklist",
        {
          method: "POST",
          headers: { Authorization: "Bearer " + localStorage.getItem("token") }
        }
      );
      this.getStudents();
      this.getCompanies();
    },


    async changeCompanyStatus(companyId, status) {
      await fetch(
        API + "/admin/companies/" + companyId + "/status",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + localStorage.getItem("token")
          },
          body: JSON.stringify({ status: status })
        }
      );
      this.getCompanies();
      this.getStats();
    },


    async changeDriveStatus(driveId, status) {
      await fetch(
        API + "/admin/drives/" + driveId + "/status",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + localStorage.getItem("token")
          },
          body: JSON.stringify({ status: status })
        }
      );
      this.getDrives();
      this.getStats();
    }
  },

  mounted() {
    this.getStats();
    this.getStudents();
    this.getCompanies();
    this.getDrives();
    this.getApplications();
  }
};

