import { Territory } from '~/types/Territory';
import { formatDateShort } from './reportService';

// ─── HTML generation for PDF ────────────────────────────────────────────────

export const generateReportHTML = (
  territories: Territory[],
  leaderNameByGroupId?: Map<string, string>
): string => {
  const rows = territories
    .map((t) => {
      const assignedName =
        leaderNameByGroupId?.get(t.groupId || '') || t.groupId || '';
      const startDate = formatDateShort(t.visitStartDate);
      const endDate = formatDateShort(t.visitEndDate);

      return `
    <!-- FILA ${t.number} -->
    <tr>
      <td rowspan="2">${t.number}</td>
      <td rowspan="2" class="thick-right">${formatDateShort(t.visitEndDate)}</td>

      <td colspan="2" class="asignado">
        ${assignedName}
      </td>

      <td colspan="2" class="asignado">
      </td>

      <td colspan="2" class="asignado">
      </td>

      <td colspan="2" class="asignado">
      </td>
    </tr>

    <tr>
      <td>${startDate}</td>
      <td>${endDate}</td>

      <td></td>
      <td></td>

      <td></td>
      <td></td>

      <td></td>
      <td></td>
    </tr>
  `;
    })
    .join('');

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: Arial, sans-serif;
            padding: 40px;
            background: #ffffff;
          }

          .container {
            width: 100%;
          }

          .table-container {
            width: 100%;
            overflow-x: auto;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 10px;
            border: 2px solid #999;
          }

          th, td {
            border: 1px solid #999;
            padding: 2px;
            text-align: center;
            vertical-align: middle;
          }

          .thick-right {
            border-right: 2px solid #999;
          }

          thead tr:first-child th {
            background: #d9d9d9;
            color: #000;
          }

          thead tr:nth-child(2) th {
            background: #e6e6e6;
            color: #000;
          }

          tbody tr {
            background: #ffffff;
          }

          tbody td {
            height: 14px;
            line-height: 14px;
          }

          th {
            white-space: normal;
            line-height: 1.3;
          }

          .asignado {
          }

          .header {
            text-align: center;
            margin-bottom: 10px;
            padding-bottom: 8px;
          }

          .header h1 {
            font-size: 16px;
            margin-bottom: 3px;
          }

          .metadata {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            font-size: 10px;
          }

          .metadata-item {
            display: flex;
            gap: 4px;
          }

          .metadata-label {
          }

          .footer {
            margin-top: 10px;
            text-align: left;
            font-size: 9px;
            color: #000;
            padding-top: 8px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>REGISTRO DE ASIGNACION DE TERRITORIO</h1>
          </div>
          
          <div class="metadata">

            <div class="metadata-item">
              <span class="metadata-label">Año de servicio:</span>
              <span>${new Date().getFullYear()}</span>
            </div>
          </div>
          
          <div class="table-container">
            <table>
              <thead>
                <!-- TITULOS PRINCIPALES -->
                <tr>
                  <th rowspan="2">
                    Núm.<br>
                    de terr.
                  </th>

                  <th rowspan="2" class="thick-right">
                    Última fecha<br>
                    en que se<br>
                    completó*
                  </th>

                  <th colspan="2">Asignado a</th>
                  <th colspan="2">Asignado a</th>
                  <th colspan="2">Asignado a</th>
                  <th colspan="2">Asignado a</th>
                </tr>

                <!-- SUBTITULOS -->
                <tr>
                  <th>
                    Fecha en que<br>
                    se asignó
                  </th>
                  <th>
                    Fecha en que<br>
                    se completó
                  </th>

                  <th>
                    Fecha en que<br>
                    se asignó
                  </th>
                  <th>
                    Fecha en que<br>
                    se completó
                  </th>

                  <th>
                    Fecha en que<br>
                    se asignó
                  </th>
                  <th>
                    Fecha en que<br>
                    se completó
                  </th>

                  <th>
                    Fecha en que<br>
                    se asignó
                  </th>
                  <th>
                    Fecha en que<br>
                    se completó
                  </th>
                </tr>
              </thead>

              <tbody>
                ${rows}
              </tbody>
            </table>
          </div>
          
          <div class="footer">
            <p>*Cuando comience una nueva página, anote en esta columna la última fecha en que los territorios se completaron.</p>
            <p>S-13-S 1/22</p>
          </div>
        </div>
      </body>
    </html>
  `;
};
