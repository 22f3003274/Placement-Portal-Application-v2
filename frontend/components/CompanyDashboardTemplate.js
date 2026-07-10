const companyDashboardTemplate = `
    <DashboardLayout title="Company Dashboard">

      <p v-if="company && company.approval_status !== 'approved'">
        Waiting for admin approval.
      </p>

      <div v-else>

        <button @click="tab = 'stats'">Stats</button>
        <button @click="tab = 'drives'">Drives</button>
        <button @click="tab = 'create'">Create Drive</button>

        <hr>

        <div v-if="tab === 'stats'">
          <h3>Stats</h3>

          <p>Total Drives: {{ total_drives }}</p>
          <p>Total Applications: {{ total_applications }}</p>
          <br>
          <button @click="exportHistory">Export Application History (CSV)</button>

        </div>

        <div v-if="tab === 'drives'">
          <h3>My Drives</h3>

          <div v-for="drive in drives" :key="drive.id">

            <h4>{{ drive.job_title }}</h4>

            <p>Status: {{ drive.status }}</p>
            <p>{{ drive.job_description }}</p>
            <p>Eligibility: {{ drive.eligibility_criteria }}</p>
            <p>Salary: {{ drive.salary_lpa }} LPA</p>
            <p>Deadline: {{ drive.application_deadline }}</p>

            <button @click="getApplications(drive.id)">View Applications</button>

            <button @click="closeDrive(drive.id)">Close Drive</button>

            <hr>

          </div>
        </div>


        <div v-if="tab === 'create'">
          <h3>Create Drive</h3>

          <form @submit.prevent="createDrive">

            <input v-model="newDrive.job_title" placeholder="Job Title" required>
            <br><br>

            <textarea v-model="newDrive.job_description" placeholder="Job Description" required></textarea>
            <br><br>

            <textarea v-model="newDrive.eligibility_criteria" placeholder="Eligibility Criteria" required></textarea>
            <br><br>

            <input v-model="newDrive.salary_lpa" type="number" placeholder="Salary">
            <br><br>

            <input v-model="newDrive.application_deadline" type="date" required>
            <br><br>

            <button type="submit">Create Drive</button>

          </form>

        </div>


        <div v-if="tab === 'applications'">
          <h3>Applications</h3>

          <button @click="tab = 'drives'"> Back </button>
          <br><br>

          <table border="1">
            <tr>
              <th>Name</th>
              <th>Branch</th>
              <th>CGPA</th>
              <th>Status</th>
            </tr>

            <tr
              v-for="application in applications"
              :key="application.application_id"
            >
              <td>{{ application.student.name }}</td>
              <td>{{ application.student.branch }}</td>
              <td>{{ application.student.cgpa }}</td>

              <td>
                <select v-model="application.status" @change="updateStatus(application)">

                  <option value="applied" :disabled="isStatusDisabled(application.status, 'applied')">Applied</option>
                  <option value="shortlisted" :disabled="isStatusDisabled(application.status, 'shortlisted')">Shortlisted</option>
                  <option value="interview" :disabled="isStatusDisabled(application.status, 'interview')">Interview</option>
                  <option value="offer" :disabled="isStatusDisabled(application.status, 'offer')">Offer</option>
                  <option value="rejected" :disabled="isStatusDisabled(application.status, 'rejected')">Rejected</option>
                  <option value="placed" :disabled="isStatusDisabled(application.status, 'placed')">Placed</option>

                </select>

                <div v-if="application.status === 'interview'" style="margin-top: 5px;">
                  <input type="datetime-local" v-model="application.interview_date" @change="updateStatus(application)">
                </div>

              </td>
            </tr>
          </table>
        </div>
      </div>
    </DashboardLayout>
  `;
