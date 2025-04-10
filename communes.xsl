<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="1.0">
    <xsl:output method="html" indent="yes" encoding="UTF-8" />

    <xsl:template match="/">
        <html>
            <head>
                <title>Vélo'v Stations Summary</title>
            </head>
            <body>
                <h2>Information about the velov stations in the Lyon metropolitan area</h2>
                <table border="1">
                    <thead>
                        <tr>
                            <th>1 Nb</th>
                            <th>2 Commune</th>
                            <th>3 Velov Station Count</th>
                            <th>4 Station with the Most available Bikes</th>
                            <th>5 Last Updated velov Station</th>
                        </tr>
                    </thead>
                    <tbody>
                        <!-- Get all non-empty communes and iterate through them -->
                        <xsl:for-each select="//velovstation[commune != ''][not(commune=preceding::velovstation/commune)]">
                            <!-- Sort communes alphabetically -->
                            <xsl:sort select="commune" />
                            
                            <xsl:variable name="currentCommune" select="commune" />
                            
                            <tr>
                                <!-- Nb (position) -->
                                <td><xsl:value-of select="position()" /></td>
                                
                                <!-- Commune name -->
                                <td><xsl:value-of select="$currentCommune" /></td>
                                
                                <!-- Count of stations in this commune -->
                                <td><xsl:value-of select="count(//velovstation[commune = $currentCommune])" /></td>
                                
                                <!-- Find station with most bikes -->
                                <xsl:for-each select="//velovstation[commune = $currentCommune][availabilityInfo/available_bikes]">
                                    <xsl:sort select="number(availabilityInfo/available_bikes)" data-type="number" order="descending" />
                                    <xsl:if test="position() = 1">
                                        <!-- Combined station name and available bikes -->
                                        <td>
                                            <span style="color: green;"><xsl:value-of select="substring-after(name, '- ')" /></span>
                                            <xsl:text> Available bikes: </xsl:text>
                                            <span style="color: blue;"> <xsl:value-of select="availabilityInfo/available_bikes" /></span>
                                        </td>
                                    </xsl:if>
                                </xsl:for-each>
                                
                                <!-- Find last updated station -->
                                <xsl:for-each select="//velovstation[commune = $currentCommune][last_update != '']">
                                    <xsl:sort select="last_update" order="descending" />
                                    <xsl:if test="position() = 1">
                                        <!-- Station name without number prefix (in green) -->
                                        <td><span style="color: green;"><xsl:value-of select="substring-after(name, '- ')" /></span>
                                        <!-- Last update timestamp (in red) -->
                                        <xsl:text> Updated: </xsl:text>
                                        <span style="color: darkred;"><xsl:value-of select="last_update" /></span></td>
                                    </xsl:if>
                                </xsl:for-each>
                            </tr>
                        </xsl:for-each>
                    </tbody>
                </table>
            </body>
        </html>
    </xsl:template>
</xsl:stylesheet>