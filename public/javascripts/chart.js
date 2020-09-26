$(document).ready( () => {

        async function getData() {
    
            await fetch('http://localhost:8080/database/database190310392199/pollData')
                .then(response => {
                    response.json().then((result) => {
                        let poll_data = [...result[0]]
                        
                    })
                })
    
        }
       
        getData()

    });  

var ctx = document.getElementById('result-chart').getContext('2d');
var resultchart = new Chart(ctx, {
    type: 'doughnut',
    data: {
        labels: ['Red', 'Blue', 'Yellow', 'Green', 'Purple', 'Orange'],
        datasets: [{
            label: '# of Votes',
            data: [12, 19, 3, 5, 2, 3],
            backgroundColor: [
                'rgba(255, 99, 132, 1.5)',
                'rgba(54, 162, 235, 1.5)',
                'rgba(255, 206, 86, 1.5)',
                'rgba(75, 192, 192, 1.5)',
                'rgba(153, 102, 255, 1.5)',
                'rgba(255, 159, 64, 1.5)'
            ],
            borderColor: [
                // 'rgba(255, 99, 132, 1)',
                // 'rgba(54, 162, 235, 1)',
                // 'rgba(255, 206, 86, 1)',
                // 'rgba(75, 192, 192, 1)',
                // 'rgba(153, 102, 255, 1)',
                // 'rgba(255, 159, 64, 1)'
                

            ],
            borderWidth: 1
        }]
    },
    options: {
        animation: {
            
        }
    }
});