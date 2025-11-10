document.addEventListener('DOMContentLoaded',()=>{
    const btn = document.getElementById('autoFill')
    const status = document.getElementById('status')
    
    btn.addEventListener('click', async()=>{
        status.textContent = "Loading ..."
        const response = await fetch(chrome.runtime.getURL('test-data.json'))
        const userData = await response.json()
        // console.log(userData) // User Data to be AutoFilled

        const [tab] = await chrome.tabs.query({active:true, currentWindow:true})
        if (!tab){
            console.log('No active tab found')
        }
        // console.log(tab.url)

        // Inject content script dynamically
        await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['content.js']
        });

        chrome.tabs.sendMessage(tab.id,{type:"START_AUTOFILL",userData}, (resp)=>{
            status.textContent = "Starting AutoFilling ..."
            if (resp.status === "success"){
                status.textContent = "Done ..."
                // console.log(resp)
            }
        })
    })
})