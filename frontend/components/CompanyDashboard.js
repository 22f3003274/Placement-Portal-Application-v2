const CompanyDashboard = {
  components: { DashboardLayout },

  template: `
    <DashboardLayout title="Company Dashboard">

      <div v-if="!isApproved">
        <p>Waiting for admin approval.</p>
      </div>

      <div v-else>

        <button @click="tab='stats'">Stats</button>
        <button @click="tab='drives'">Drives</button>
        <button @click="tab='create'">Create Drive</button>

        <hr>

        <!-- Stats -->
        <div v-if="tab === 'stats'">
          <p>Total Drives: {{ total_drives }}</p>
          <p>Total Applications: {{ total_applications }}</p>
        </div>

        <!-- Drives -->
        <div v-if="tab === 'drives'">

          <div v-if="drives.length === 0">
            No drives available.
          </div>

          <div v-for="drive in drives" :key="drive.id">
            <h3>{{ drive.job_title }}</h3>

            <p>Status: {{ drive.status }}</p>
            <p>{{ drive.job_description }}</p>
            <p>Eligibility: {{ drive.eligibility_criteria }}</p>
            <p>Salary: {{ drive.salary_lpa }} LPA</p>
            <p>Deadline: {{ drive.application_deadline }}</p>

            <button @click="viewApplications(drive.id)">
              View Applications
            </button>

            <button
              v-if="drive.status !== 'closed'"
              @click="closeDrive(drive.id)">
              Close Drive
            </button>

            <hr>
          </div>
        </div>

        <!-- Create Drive -->
        <div v-if="tab === 'create'">

          <form @submit.prevent="createDrive">

            <div>
              <input
                v-model="newDrive.job_title"
                placeholder="Job Title"
                required>
            </div>

            <div>
              <textarea
                v-model="newDrive.job_description"
                placeholder="Job Description"
                required>
              </textarea>
            </div>

            <div>
              <textarea
                v-model="newDrive.eligibility_criteria"
                placeholder="Eligibility Criteria"
                required>
              </textarea>
            </div>

            <div>
              <input
                type="number"
                v-model="newDrive.salary_lpa"
                placeholder="Salary">
            </div>

            <div>
              <input
                type="date"
                v-model="newDrive.application_deadline"
                required>
            </div>

            <button type="submit">Create</button>

          </form>
        </div>

        <!-- Applications -->
        <div v-if="tab === 'apps'">

          <button @click="tab='drives'">
            Back
          </button>

          <table border="1">

            <tr>
              <th>Name</th>
              <th>Branch</th>
              <th>CGPA</th>
              <th>Status</th>
            </tr>

            <tr
              v-for="app in applications"
              :key="app.application_id">

              <td>{{ app.student.name }}</td>
              <td>{{ app.student.branch }}</td>
              <td>{{ app.student.cgpa }}</td>

              <td>
                <select
                  v-model="app.status"
                  @change="updateStatus(app.application_id, app.status)">

                  <option value="applied">Applied</option>
                  <option value="shortlisted">Shortlisted</option>
                  <option value="interview">Interview</option>
                  <option value="offer">Offer</option>
                  <option value="rejected">Rejected</option>
                  <option value="placed">Placed</option>

                </select>
              </td>

            </tr>

          </table>

        </div>

      </div>

    </DashboardLayout>
  `,

  data() {
    return {
      company: null,
      drives: [],
      total_drives: 0,
      total_applications: 0,
      applications: [],
      tab: "stats",

      newDrive: {
        job_title: "",
        job_description: "",
        eligibility_criteria: "",
        salary_lpa: "",
        application_deadline: ""
      }
    };
  },

  computed: {
    isApproved() {
      return this.company &&
        this.company.approval_status === "approved";
    }
  },

  methods: {

    async fetchDashboard() {
      const res = await fetch(API + "/company/dashboard", {
        headers: {
          Authorization: "Bearer " + userAuth.getTok()
        }
      });

      if (res.ok) {
        const data = await res.json();
        Object.assign(this, data);
      }
    },

    async createDrive() {
      const res = await fetch(API + "/company/drive/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + userAuth.getTok()
        },
        body: JSON.stringify(this.newDrive)
      });

      if (res.ok) {
        alert("Drive created");
        this.fetchDashboard();
        this.tab = "drives";
      }
    },

    async closeDrive(id) {
      const res = await fetch(
        API + "/company/drive/close/" + id,
        {
          method: "POST",
          headers: {
            Authorization: "Bearer " + userAuth.getTok()
          }
        }
      );

      if (res.ok) {
        this.fetchDashboard();
      }
    },

    async viewApplications(id) {
      const res = await fetch(
        API + "/company/drive/" + id + "/applications",
        {
          headers: {
            Authorization: "Bearer " + userAuth.getTok()
          }
        }
      );

      if (res.ok) {
        this.applications = await res.json();
        this.tab = "apps";
      }
    },

    async updateStatus(id, status) {
      await fetch(
        API + "/company/application/" + id + "/status",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + userAuth.getTok()
          },
          body: JSON.stringify({ status })
        }
      );
    }
  },

  mounted() {
    this.fetchDashboard();
  }
};