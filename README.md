# 🔍 http-status-monitor - Track website health and availability daily

[![Download Now](https://img.shields.io/badge/Download-Application-blue.svg)](https://github.com/petuniapsychopathological990/http-status-monitor)

This tool checks your websites for broken links and status changes. It keeps a history of these changes so you can spot problems before they cause outages. You run this on your Windows computer to see if your sites stay online.

## 🛠️ System Requirements

You need a basic Windows computer to run this tool. Ensure you have the following:

*   Windows 10 or Windows 11.
*   An active internet connection.
*   Basic disk space for log files.
*   Node.js installed on your system.

## 📥 How to Install

Follow these steps to set up your monitor.

1.  Visit this page to download: [https://github.com/petuniapsychopathological990/http-status-monitor](https://github.com/petuniapsychopathological990/http-status-monitor)
2.  Click the green button labeled Code.
3.  Select Download ZIP.
4.  Save the folder to your computer.
5.  Extract all files from the ZIP folder into a folder on your desktop.
6.  Open your Start menu and type cmd. Select Command Prompt.
7.  Type cd and drag your new folder into the window. Press Enter.
8.  Type npm install and press Enter. This step loads the necessary pieces to make the tool work.

## ⚙️ Setting Up Your Links

The tool uses a simple text file to know which websites to check.

1.  Open the folder you extracted earlier.
2.  Find the file named links.txt.
3.  Open this file using Notepad.
4.  Type one website address on each line. Include the https:// part of the address.
5.  Save the file and close Notepad.

## 🚀 How to Run the Monitor

The monitor runs inside the Command Prompt window. When you want to see if your sites are working:

1.  Open the Command Prompt window again if you closed it.
2.  Type npm start and press Enter.
3.  The tool reads your links file and checks each site.
4.  The system reports the HTTP status for every link.
5.  It logs these results to a database file.

## 📈 Understanding the Results

The tool produces a list of status codes. These codes tell you exactly what happened when the tool contacted your website.

*   200: Everything is normal. The page loaded as expected.
*   301 or 302: The site moved to a different address.
*   404: The system could not find the page. This is a broken link.
*   500: The server hosting the site encountered an error.

The tool tracks these changes every day. If a site moved from working to broken, the history file records this shift.

## 📁 Managing Your Data

All data stays on your local machine. The tool saves logs in the main folder. You can open these files with any text editor to review the history of your site health.

If you want to clear your history, simply delete the files ending in .db. The tool creates new ones the next time you start it. Be careful, as this removes all previous tracking data.

## 🔧 Frequently Asked Questions

**Does this tool slow down my computer?**
The tool runs only when you start it. It does not stay open in the background or use memory when you do not need it.

**Can I monitor thousands of websites?**
Yes. Increase the number of links in your text file. Keep in mind that checking many sites takes more time and uses more internet data.

**Do I need an account to use this?**
No. You do not need to register or sign in to any service. All information remains on your machine.

**What happens if I lose my internet connection?**
The tool marks the sites as unreachable. It logs this status just like any other error. Once your internet returns, the next check will show the normal status again.

**Can I change how often it checks?**
The tool performs checks when you give the command. You can automate this using the Windows Task Scheduler if you prefer regular updates without manual input.

## ⚠️ Troubleshooting Tips

If you encounter issues, try these steps:

*   Check that your website addresses start with http:// or https:// in your links file.
*   Ensure you saved the links file after adding your URLs.
*   If the system reports a 404 error, test the link manually in your web browser. If the browser also fails, the website address is likely wrong.
*   If you receive an error about "npm," reinstall Node.js from the official website and restart your computer.

Always keep your folder clean to ensure the tool can find your files. Do not rename the main files provided in the download, as the tool relies on those specific names to function.